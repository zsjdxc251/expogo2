import { useEffect, useRef, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { C, OP_SYMBOL, RADIUS, SHADOW, SHADOW_SM } from "../lib/theme";
import { ACH_DEFS } from "../lib/points";
import { playLevelUp } from "../lib/sounds";
import { useApp } from "../lib/AppContext";
import ProgressRing from "../components/ProgressRing";
import SpeakButton from "../components/SpeakButton";

function fmt(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
}

function getEmojiFeedback(acc) {
  if (acc >= 100) return { text: "太棒了！全部答对！", color: "#FFD700" };
  if (acc >= 80) return { text: "太棒了！继续保持！", color: C.success };
  if (acc >= 60) return { text: "不错哦，继续努力！", color: C.accent };
  return { text: "没关系，再来一次吧！", color: "#8E99A4" };
}

function useCountUp(target, duration = 800) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    const listener = anim.addListener(({ value }) =>
      setDisplay(Math.round(value)),
    );
    Animated.timing(anim, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
  }, [target]);

  return display;
}

export default function ResultsScreen() {
  const { quizResult: data, lastQuizRoute } = useApp();
  const nav = useNavigation();
  const onHome = useCallback(() => nav.popToTop(), [nav]);
  const onRetry = useCallback(() => {
    if (lastQuizRoute) {
      nav.replace(lastQuizRoute.routeName, lastQuizRoute.params);
    } else {
      nav.popToTop();
    }
  }, [nav, lastQuizRoute]);

  useEffect(() => {
    if (!data) nav.popToTop();
  }, [data, nav]);

  if (!data) return null;

  const {
    correct = 0,
    wrong = 0,
    elapsed = 0,
    pointsEarned = 0,
    accuracy = 0,
    levelUp,
    newLevel,
    newAchievements = [],
    wrongList = [],
    taskBonus = 0,
    isPerfect = false,
    perfectBonusValue = 0,
  } = data;

  const fb = getEmojiFeedback(accuracy);
  const accDisplay = useCountUp(accuracy, 900);
  const ptsDisplay = useCountUp(pointsEarned, 800);

  const starScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (levelUp) {
      playLevelUp();
      Animated.sequence([
        Animated.delay(600),
        Animated.spring(starScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);

  return (
    <ScrollView
      style={st.scroll}
      contentContainerStyle={st.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={st.topBar}>
        <View style={st.topAvatar}>
          <MaterialIcons name="face" size={24} color={C.onPrimaryContainer} />
        </View>
        <Text style={st.topTitle}>学习乐园</Text>
      </View>

      <View style={st.body}>
        <View style={st.banner}>
          <Text style={st.bannerEm1}>✨</Text>
          <Text style={st.bannerEm2}>⭐</Text>
          <Text style={st.bannerEm3}>🎈</Text>
          <Text style={st.bannerHeadline}>🌟 {fb.text}</Text>
        </View>

        <View style={st.ringCard}>
          <ProgressRing
            size={192}
            strokeWidth={12}
            progress={accuracy}
            color={C.primary}
            trackColor={C.surfaceContainerHigh}
          >
            <Text style={st.ringPct}>{accDisplay}%</Text>
            <Text style={st.ringLabel}>正确率</Text>
          </ProgressRing>
        </View>

        <View style={st.bentoRow}>
          <View style={st.timeCard}>
            <View style={st.timeIconWrap}>
              <MaterialIcons
                name="timer"
                size={28}
                color={C.onSecondaryFixed}
              />
            </View>
            <Text style={st.bentoLabel}>耗时</Text>
            <Text style={st.bentoVal}>{fmt(elapsed)}</Text>
          </View>
          <View style={st.pointsCard}>
            <Text style={st.trophyDeco}>🏆</Text>
            <View style={st.pointsIconWrap}>
              <MaterialIcons name="stars" size={28} color="#F57F17" />
            </View>
            <Text style={st.bentoLabel}>积分</Text>
            <Text style={st.bentoVal}>+{ptsDisplay}</Text>
          </View>
        </View>

        <View style={st.cwCard}>
          <View style={st.cwCol}>
            <View style={st.cwIconOk}>
              <MaterialIcons name="check" size={22} color={C.primary} />
            </View>
            <Text style={st.cwTxtOk} numberOfLines={1} adjustsFontSizeToFit>
              {correct} 答对
            </Text>
          </View>
          <View style={st.cwDivider} />
          <View style={st.cwCol}>
            <View style={st.cwIconBad}>
              <MaterialIcons
                name="close"
                size={22}
                color={C.onErrorContainer}
              />
            </View>
            <Text style={st.cwTxtBad} numberOfLines={1} adjustsFontSizeToFit>
              {wrong} 答错
            </Text>
          </View>
        </View>

        {isPerfect && perfectBonusValue > 0 && (
          <View style={st.perfectBanner}>
            <Text style={st.perfectTxt}>
              🎉 全对奖励 +{perfectBonusValue} 积分
            </Text>
          </View>
        )}
        {taskBonus > 0 && (
          <View style={st.bonusBanner}>
            <Text style={st.bonusTxt}>含任务奖励 +{taskBonus}</Text>
          </View>
        )}

        {levelUp && newLevel && (
          <Animated.View
            style={[st.lvUp, { transform: [{ scale: starScale }] }]}
          >
            <Text style={st.lvEmoji}>🌟</Text>
            <Text style={st.lvTxt}>
              升级! Lv.{newLevel.level} {newLevel.title}
            </Text>
          </Animated.View>
        )}

        {newAchievements.length > 0 &&
          newAchievements.map((id) => {
            const def = ACH_DEFS.find((a) => a.id === id);
            if (!def) return null;
            return (
              <View key={id} style={st.achCard}>
                <View style={st.achIconBox}>
                  <MaterialIcons name="bolt" size={36} color={C.onPrimary} />
                </View>
                <View style={st.achTextCol}>
                  <Text style={st.achUnlockLabel}>解锁新勋章！</Text>
                  <Text style={st.achNameNew}>{def.name}</Text>
                  {def.desc ? (
                    <Text style={st.achDescNew}>{def.desc}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}

        {wrongList.length > 0 && (
          <View style={st.wrongSec}>
            <Text style={st.wrongTitle}>错题回顾 ({wrongList.length}题)</Text>
            {wrongList.map((w, i) => {
              const isCharPractice = w.op === "chn_charPractice";
              const wIsEng =
                w.op && (w.op.startsWith("eng") || w.op.startsWith("chn_"));
              const hasStem = w.stem || w.char;

              if (isCharPractice) {
                const display = w.char || w.stem || "?";
                const correctAns = w.pinyin || w.answer || "—";
                const userAns =
                  w.userAnswer !== null &&
                  w.userAnswer !== undefined &&
                  w.userAnswer !== "(错误)"
                    ? w.userAnswer
                    : "—";
                return (
                  <View key={i} style={st.wrongCard}>
                    <View style={st.wrongQRow}>
                      <Text style={[st.wrongQ, { fontSize: 28 }]}>
                        {display}
                      </Text>
                      <SpeakButton
                        text={display}
                        size="small"
                        language="zh-CN"
                      />
                    </View>
                    <View style={st.wrongRow}>
                      <Text style={st.wrongLbl}>
                        你的答案{" "}
                        <Text style={{ color: C.error, fontWeight: "700" }}>
                          {userAns}
                        </Text>
                      </Text>
                      <Text style={st.wrongLbl}>
                        正确答案{" "}
                        <Text style={{ color: C.success, fontWeight: "700" }}>
                          {correctAns}
                        </Text>
                      </Text>
                    </View>
                  </View>
                );
              }

              if (wIsEng || hasStem) {
                const stem = w.stem || w.char || "?";
                const lang = w.op?.startsWith("chn_") ? "zh-CN" : "en-US";
                return (
                  <View key={i} style={st.wrongCard}>
                    <View style={st.wrongQRow}>
                      <Text style={[st.wrongQ, { flex: 1 }]}>{stem}</Text>
                      <SpeakButton
                        text={stem.replace(/___/g, "blank")}
                        size="small"
                        language={lang}
                      />
                    </View>
                    <View style={st.wrongRow}>
                      <Text style={st.wrongLbl}>
                        你的答案{" "}
                        <Text style={{ color: C.error, fontWeight: "700" }}>
                          {w.userAnswer !== null && w.userAnswer !== undefined
                            ? (w.options?.[w.userAnswer] ?? w.userAnswer)
                            : "—"}
                        </Text>
                      </Text>
                      <Text style={st.wrongLbl}>
                        正确答案{" "}
                        <Text style={{ color: C.success, fontWeight: "700" }}>
                          {w.options?.[w.answer] ?? w.answer}
                        </Text>
                      </Text>
                    </View>
                    {w.explanation ? (
                      <Text style={st.wrongExpl}>💡 {w.explanation}</Text>
                    ) : null}
                  </View>
                );
              }

              const sym = OP_SYMBOL[w.op] || "?";
              const isDivMulti = w.op === "divRem" || w.op === "divReverse";
              const qStr = isDivMulti
                ? `${w.left} ÷ ${w.right} = ${w.result} ... ${w.remainder}`
                : `${w.left} ${sym} ${w.right} = ${w.result}`;

              const fmtAnswer = (ans) => {
                if (ans === null || ans === undefined) return "—";
                if (typeof ans === "object") {
                  if ("q" in ans) return `商=${ans.q}, 余=${ans.r}`;
                  if ("dividend" in ans)
                    return `被除数=${ans.dividend}, 余=${ans.remainder}`;
                  return JSON.stringify(ans);
                }
                return String(ans);
              };

              return (
                <View key={i} style={st.wrongCard}>
                  <Text style={st.wrongQ}>{qStr}</Text>
                  <View style={st.wrongRow}>
                    <Text style={st.wrongLbl}>
                      你的答案{" "}
                      <Text style={{ color: C.error, fontWeight: "700" }}>
                        {fmtAnswer(w.userAnswer)}
                      </Text>
                    </Text>
                    <Text style={st.wrongLbl}>
                      正确答案{" "}
                      <Text style={{ color: C.success, fontWeight: "700" }}>
                        {fmtAnswer(w.answer)}
                      </Text>
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={st.btnRow}>
          <TouchableOpacity
            style={st.homeBtn}
            onPress={onHome}
            activeOpacity={0.8}
          >
            <MaterialIcons name="home" size={20} color={C.text} />
            <Text style={st.homeBtnTxt}>返回主页</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={st.retryBtn}
            onPress={onRetry}
            activeOpacity={0.8}
          >
            <MaterialIcons name="replay" size={20} color={C.onPrimary} />
            <Text style={st.retryBtnTxt}>再来一次</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const BAR_R = 20;
const CYAN_100 = "#cffafe";

const st = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 40, paddingHorizontal: 0 },

  topBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.headerBg,
    borderBottomWidth: 2,
    borderBottomColor: CYAN_100,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    ...SHADOW,
  },
  topAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { fontSize: 24, fontWeight: "900", color: C.titleAccent, flex: 1 },

  body: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: "stretch",
  },

  banner: {
    position: "relative",
    backgroundColor: C.primaryContainer,
    borderRadius: BAR_R,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    overflow: "hidden",
    shadowColor: "rgba(51,143,155,0.2)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },
  bannerEm1: {
    position: "absolute",
    top: 10,
    left: 14,
    fontSize: 24,
    opacity: 0.9,
  },
  bannerEm2: {
    position: "absolute",
    top: 6,
    right: 18,
    fontSize: 22,
    opacity: 0.95,
  },
  bannerEm3: {
    position: "absolute",
    bottom: 8,
    right: 28,
    fontSize: 24,
    opacity: 0.9,
  },
  bannerHeadline: {
    fontSize: 28,
    fontWeight: "600",
    color: C.onPrimaryContainer,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  ringCard: {
    width: "100%",
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: BAR_R,
    padding: 32,
    alignItems: "center",
    marginBottom: 16,
    ...SHADOW,
  },
  ringPct: { fontSize: 40, fontWeight: "700", color: C.primary },
  ringLabel: {
    fontSize: 16,
    color: C.outline,
    marginTop: 4,
    fontWeight: "400",
  },

  bentoRow: { flexDirection: "row", gap: 12, width: "100%", marginBottom: 12 },
  timeCard: {
    flex: 1,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: BAR_R,
    padding: 16,
    alignItems: "center",
    ...SHADOW,
  },
  timeIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.secondaryFixed,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  pointsCard: {
    flex: 1,
    position: "relative",
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: BAR_R,
    padding: 16,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFD700",
    overflow: "hidden",
    ...SHADOW,
  },
  trophyDeco: {
    position: "absolute",
    fontSize: 72,
    alignSelf: "center",
    top: "18%",
    opacity: 0.2,
  },
  pointsIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF9C4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    zIndex: 1,
  },
  bentoLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: C.outline,
    marginBottom: 2,
    zIndex: 1,
  },
  bentoVal: { fontSize: 20, fontWeight: "600", color: C.text, zIndex: 1 },

  cwCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: BAR_R,
    padding: 16,
    marginBottom: 12,
    ...SHADOW,
  },
  cwCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cwDivider: { width: 1, backgroundColor: C.outlineVariant, marginVertical: 4 },
  cwIconOk: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  cwIconBad: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.errorContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  cwTxtOk: { fontSize: 16, fontWeight: "600", color: C.text, flexShrink: 1 },
  cwTxtBad: {
    fontSize: 16,
    fontWeight: "600",
    color: C.onErrorContainer,
    flexShrink: 1,
  },

  perfectBanner: {
    backgroundColor: "rgba(255,215,0,0.12)",
    borderRadius: BAR_R,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    width: "100%",
    alignItems: "center",
    ...SHADOW_SM,
  },
  perfectTxt: { fontSize: 14, fontWeight: "700", color: "#D4A017" },
  bonusBanner: {
    backgroundColor: C.successBg,
    borderRadius: BAR_R,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 6,
    width: "100%",
    alignItems: "center",
    ...SHADOW_SM,
  },
  bonusTxt: { fontSize: 13, fontWeight: "600", color: C.success },

  lvUp: { alignItems: "center", marginVertical: 12 },
  lvEmoji: { fontSize: 44 },
  lvTxt: { fontSize: 18, fontWeight: "700", color: C.accent, marginTop: 4 },

  achCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.tertiaryFixed,
    borderRadius: BAR_R,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: C.tertiary,
    gap: 14,
    shadowColor: "rgba(136,77,30,0.15)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 3,
  },
  achIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: C.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  achTextCol: { flex: 1 },
  achUnlockLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: C.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  achNameNew: { fontSize: 20, fontWeight: "600", color: C.text, marginTop: 4 },
  achDescNew: { fontSize: 12, color: C.outline, marginTop: 4, lineHeight: 16 },

  wrongSec: { marginTop: 20, width: "100%" },
  wrongTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    marginBottom: 10,
  },
  wrongCard: {
    backgroundColor: C.errorBg,
    borderRadius: BAR_R,
    padding: 14,
    marginBottom: 8,
  },
  wrongQRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  wrongQ: { fontSize: 17, fontWeight: "700", color: C.text },
  wrongRow: { flexDirection: "row", justifyContent: "space-between" },
  wrongLbl: { fontSize: 13, color: C.textMid },
  wrongExpl: {
    fontSize: 12,
    color: C.secondary,
    marginTop: 6,
    backgroundColor: C.secondaryBg,
    padding: 8,
    borderRadius: RADIUS,
  },

  btnRow: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    marginBottom: 8,
  },
  homeBtn: {
    flex: 1,
    height: 56,
    borderRadius: 9999,
    backgroundColor: C.surfaceContainerHighest,
    borderBottomWidth: 4,
    borderBottomColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  homeBtnTxt: { fontSize: 16, fontWeight: "700", color: C.text },
  retryBtn: {
    flex: 1,
    height: 56,
    borderRadius: 9999,
    backgroundColor: C.primary,
    borderBottomWidth: 4,
    borderBottomColor: C.primaryDark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  retryBtnTxt: { fontSize: 16, fontWeight: "700", color: C.onPrimary },
});
