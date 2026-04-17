import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { C, RADIUS, SUBJECT_COLORS } from '../lib/theme';
import { getCharsForLessons, getWordInfo, TABLE_TYPE_LABELS } from '../lib/textbookData';
import StrokeAnimation from '../components/StrokeAnimation';

export default function TextbookLearnScreen() {
  const nav = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const sc = SUBJECT_COLORS.chinese;
  const { tableType, lessonKeys } = route.params || {};

  const items = useMemo(() => getCharsForLessons(tableType, lessonKeys || []), [tableType, lessonKeys]);
  const total = items.length;

  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const item = items[idx];

  const animateTo = useCallback((nextIdx) => {
    Speech.stop();
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setIdx(nextIdx);
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const goPrev = () => { if (idx > 0) animateTo(idx - 1); };
  const goNext = () => {
    if (idx < total - 1) animateTo(idx + 1);
    else setDone(true);
  };

  const speak = useCallback((text) => {
    Speech.stop();
    Speech.speak(text, { language: 'zh-CN', rate: 0.75 });
  }, []);

  if (!item && !done) return null;

  if (done) {
    return (
      <View style={[st.root, { paddingTop: insets.top }]}>
        <View style={st.doneBox}>
          <Text style={st.doneEmoji}>🎉</Text>
          <Text style={st.doneTitle}>学习完成！</Text>
          <Text style={st.doneDesc}>
            共学习了 {total} 个{tableType === 'ciyu' ? '词语' : '字'}
          </Text>
          <TouchableOpacity
            style={[st.doneBtn, { backgroundColor: sc.primary }]}
            onPress={() => nav.navigate('TextbookDictation', { tableType, lessonKeys })}
          >
            <Text style={st.doneBtnTxt}>去听写 ✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.doneBtnSec} onPress={() => nav.goBack()}>
            <Text style={[st.doneBtnSecTxt, { color: sc.primary }]}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isChar = tableType === 'shizi' || tableType === 'xiezi';
  const char = isChar ? item.char : null;
  const pinyin = isChar ? item.pinyin : null;
  const word = !isChar ? item.word : null;
  const info = char ? getWordInfo(char) : null;

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Text style={[st.back, { color: sc.primary }]}>← 返回</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>{TABLE_TYPE_LABELS[tableType]}</Text>
        <Text style={st.headerProg}>{idx + 1}/{total}</Text>
      </View>

      <View style={st.progBar}>
        <View style={[st.progFill, { width: `${((idx + 1) / total) * 100}%`, backgroundColor: sc.primary }]} />
      </View>

      <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {isChar ? (
            <CharCard
              char={char}
              pinyin={pinyin}
              info={info}
              showStroke={tableType === 'xiezi'}
              onSpeak={speak}
              sc={sc}
            />
          ) : (
            <WordCard word={word} onSpeak={speak} sc={sc} />
          )}
        </Animated.View>
      </ScrollView>

      <View style={[st.navRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[st.navBtn, idx === 0 && st.navBtnOff]}
          onPress={goPrev}
          disabled={idx === 0}
        >
          <Text style={[st.navBtnTxt, idx === 0 && { color: C.textLight }]}>← 上一个</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.navBtn, { backgroundColor: sc.primary }]}
          onPress={goNext}
          activeOpacity={0.8}
        >
          <Text style={st.navBtnTxtW}>
            {idx === total - 1 ? '完成学习 ✓' : '下一个 →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CharCard({ char, pinyin, info, showStroke, onSpeak, sc }) {
  return (
    <View style={st.card}>
      <Text style={st.pinyin}>{pinyin}</Text>
      <TouchableOpacity onPress={() => onSpeak(char)} activeOpacity={0.7}>
        <Text style={st.bigChar}>{char}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[st.speakBtn, { backgroundColor: sc.bg }]} onPress={() => onSpeak(char)}>
        <Text style={[st.speakTxt, { color: sc.primary }]}>🔊 点击朗读</Text>
      </TouchableOpacity>

      {showStroke && (
        <View style={st.strokeSection}>
          <Text style={st.sectionTitle}>✍️ 笔顺演示</Text>
          <StrokeAnimation char={char} size={220} />
        </View>
      )}

      <View style={st.section}>
        <Text style={st.sectionTitle}>{info?.emoji || '📝'} 组词</Text>
        {(info?.words || []).map((w, i) => (
          <View key={i} style={st.wordRow}>
            <Text style={st.wordText}>
              {w.word.split('').map((c, ci) => (
                <Text
                  key={ci}
                  style={ci === w.highlight ? st.wordHighlight : st.wordNormal}
                >
                  {c}
                </Text>
              ))}
            </Text>
            <TouchableOpacity onPress={() => onSpeak(w.word)} style={st.miniSpeak}>
              <Text>🔊</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={[st.meaningBox, { backgroundColor: sc.bg }]}>
        <Text style={st.meaningLabel}>💡 释义</Text>
        <Text style={st.meaningTxt}>{info?.meaning || `学习"${char}"`}</Text>
      </View>
    </View>
  );
}

const WORD_DATA = {
  "春天": { emoji: "🌸🌿☀️🦋", scene: "冰雪融化，小花开了，蝴蝶飞来飞去", meaning: "一年中的第一个季节，万物复苏", memory: "\"春\"字上面是三个人，下面是日，三人在太阳下就是春天来了", example: "春天到了，小草从地里钻出来了。", bg: "#E8F5E9" },
  "寻找": { emoji: "🔍👀🐾", scene: "拿着放大镜，到处找东西", meaning: "到处去找，想要找到", memory: "\"寻\"是在路上找，\"找\"是用手去抓——眼睛找，手去拿", example: "小明在寻找丢失的铅笔。", bg: "#E3F2FD" },
  "眉毛": { emoji: "😊👁️✨", scene: "人的脸上，眼睛上方弯弯的毛", meaning: "长在眼睛上面的毛", memory: "\"眉\"字里有个\"目\"，眉毛长在\"目\"（眼睛）上面", example: "妈妈的眉毛弯弯的，像月亮一样。", bg: "#FFF3E0" },
  "野花": { emoji: "🌺🏕️🌾🐝", scene: "野外的草地上开着五颜六色的花，蜜蜂嗡嗡飞", meaning: "长在野外的花", memory: "\"野\"就是田野，不是花园种的，是大自然自己长的花", example: "路边开满了五颜六色的野花。", bg: "#FFF8E1" },
  "柳枝": { emoji: "🌳💚🍃💨", scene: "河边的柳树，长长的枝条在风中飘摇", meaning: "柳树的枝条", memory: "柳树的枝条像小女孩的长辫子，风一吹就摇啊摇", example: "春风吹过，柳枝轻轻摇摆。", bg: "#E8F5E9" },
  "桃花": { emoji: "🌸🏔️🩷", scene: "粉嘟嘟的桃花开了一树", meaning: "桃树开的粉色花", memory: "桃花是粉红色的，像小姑娘害羞红了脸", example: "三月的桃花开得可美了！", bg: "#FCE4EC" },
  "鲜花": { emoji: "💐🌹🌻🎁", scene: "一束包装漂亮的花，送给喜欢的人", meaning: "新鲜好看的花", memory: "\"鲜\"就是新鲜、鲜亮，鲜花就是又新鲜又好看的花", example: "老师收到了一束美丽的鲜花。", bg: "#F3E5F5" },
  "先生": { emoji: "👨‍🏫🎩🤝", scene: "一位穿着整齐的男士在礼貌鞠躬", meaning: "对人的尊称", memory: "\"先生\"先出生的人，年纪大的人我们尊敬地叫先生", example: "王先生是我们的邻居。", bg: "#E8EAF6" },
  "原来": { emoji: "💡😮❗", scene: "灯泡亮了！哦，原来是这样啊！", meaning: "一开始的时候，表示发现", memory: "当你发现真相时就会说"原来"——恍然大悟的感觉", example: "原来是小猫把花瓶打翻了！", bg: "#FFF8E1" },
  "大叔": { emoji: "👨🧔💪", scene: "一位年纪比爸爸大一点的男性", meaning: "对年长男性的称呼", memory: "比爸爸大的叫伯伯，差不多大的叫叔叔，统称大叔", example: "隔壁的大叔经常帮我们修东西。", bg: "#EFEBE9" },
  "太太": { emoji: "👩💍🏠", scene: "一位温柔的阿姨在打理家务", meaning: "对已婚女性的称呼", memory: "\"太\"是很大很尊贵的意思，太太是对女士的尊敬称呼", example: "王太太做的蛋糕特别好吃。", bg: "#FFF3E0" },
  "做客": { emoji: "🏠🚪🍰🤗", scene: "去别人家做客，主人端出好吃的", meaning: "去别人家里玩", memory: "去别人家里做\"客人\"——有好吃的，要懂礼貌哦", example: "周末我们去奶奶家做客。", bg: "#E0F7FA" },
  "惊奇": { emoji: "😲🎪✨⭐", scene: "看到了不可思议的魔术表演，惊讶得张大嘴巴", meaning: "感到非常奇怪和意外", memory: "\"惊\"是吓一跳，\"奇\"是奇怪——又吃惊又好奇", example: "看到魔术表演，小朋友们感到非常惊奇。", bg: "#EDE7F6" },
  "快活": { emoji: "😄🎉🎈🌈", scene: "小朋友们在草地上蹦蹦跳跳", meaning: "开心快乐的意思", memory: "又快乐又活泼——想象小鱼在水里快乐地游来游去", example: "小鸟在枝头快活地唱歌。", bg: "#FFF9C4" },
  "美好": { emoji: "🌅🌺💫🎵", scene: "美丽的日落，好听的音乐，一切都很棒", meaning: "非常好，让人高兴", memory: "\"美\"是好看，\"好\"是好的——又美又好，最棒的样子", example: "今天是美好的一天！", bg: "#FFEBEE" },
  "礼物": { emoji: "🎁🎀🎊😍", scene: "一个包装精美的盒子，打开充满惊喜", meaning: "送给别人的东西", memory: "过生日时别人送你的惊喜盒子就是礼物", example: "妈妈送给我一份生日礼物。", bg: "#FCE4EC" },
  "植树": { emoji: "🌱🪴🌳💧", scene: "挖坑、放树苗、填土、浇水", meaning: "种树", memory: "\"植\"就是种的意思，植树就是种一棵小树苗", example: "植树节那天，我们在学校种了一棵小树。", bg: "#E8F5E9" },
  "故事": { emoji: "📖🐉👸🏰", scene: "翻开书本，里面有龙和公主的冒险", meaning: "有趣的事情的讲述", memory: "\"故\"是过去的事，\"事\"是事情——过去发生的有趣事情", example: "睡前，妈妈给我讲了一个有趣的故事。", bg: "#E3F2FD" },
  "生活": { emoji: "🏠🍽️😊☀️", scene: "起床、吃饭、上学、玩耍——每天做的事", meaning: "日常的吃穿住行", memory: "\"生\"是活着，\"活\"是过日子——每天开心过日子", example: "我们的生活越来越美好了。", bg: "#FFF3E0" },
  "美食": { emoji: "🍕🍜🧁🤤", scene: "各种好吃的摆满一桌", meaning: "好吃的食物", memory: "又美味又是食物——就是让人流口水的好吃的", example: "这条街上有好多美食。", bg: "#FFF8E1" },
  "茄子": { emoji: "🍆💜🥘", scene: "一个圆圆胖胖的紫色蔬菜", meaning: "一种紫色的蔬菜", memory: "茄子穿着紫色的衣服，圆滚滚的，像个小胖子", example: "妈妈做的红烧茄子特别好吃。", bg: "#EDE7F6" },
  "烤鸭": { emoji: "🦆🔥🍽️🏮", scene: "金黄酥脆的烤鸭，配上薄饼和酱", meaning: "烤制的鸭子，北京特色", memory: "把鸭子放在火上烤得金灿灿——北京最有名的菜", example: "去北京一定要吃一次烤鸭。", bg: "#FBE9E7" },
  "羊肉": { emoji: "🐑🥩🍲🔥", scene: "热腾腾的羊肉火锅，冬天吃最暖和", meaning: "羊身上的肉", memory: "小羊咩咩叫，羊身上的肉就是羊肉，冬天吃很暖和", example: "冬天吃一碗热乎乎的羊肉汤真舒服。", bg: "#FFEBEE" },
  "蛋炒饭": { emoji: "🍳🍚🥢😋", scene: "鸡蛋和米饭在锅里翻炒，香喷喷的", meaning: "用鸡蛋炒的米饭", memory: "鸡蛋+炒+饭=蛋炒饭，最简单又最好吃的一道菜", example: "爸爸做的蛋炒饭是世界上最好吃的。", bg: "#FFF9C4" },
  "钱币": { emoji: "🪙💰🏛️", scene: "古代圆圆的铜钱，中间有个方孔", meaning: "古代用来买东西的钱", memory: "古时候用铜做的圆币，\"外圆内方\"", example: "博物馆里有很多古代的钱币。", bg: "#FFF8E1" },
  "钱财": { emoji: "💰💎🏦", scene: "金子银子和各种值钱的东西", meaning: "钱和值钱的东西", memory: "\"钱\"是钱，\"财\"是财富——所有值钱的东西统称钱财", example: "钱财不是最重要的，健康才是。", bg: "#FFFDE7" },
  "有关": { emoji: "🔗🤔📎", scene: "两样东西用链条连在一起", meaning: "和某件事有联系", memory: "\"有\"是存在，\"关\"是关系——两件事之间有关系", example: "这个故事和春天有关。", bg: "#E8EAF6" },
  "样子": { emoji: "👤🪞🎭", scene: "照镜子看看自己什么样子", meaning: "外表的形态", memory: "照镜子看到自己的\"样子\"——就是一个东西长什么样", example: "这只小猫的样子真可爱。", bg: "#F3E5F5" },
  "甲骨文": { emoji: "🐢🦴✍️📜", scene: "远古时代，人们把字刻在龟壳和骨头上", meaning: "刻在龟壳和骨头上的古代文字", memory: "甲=龟壳，骨=动物骨头，文=文字——刻在龟壳骨头上的古文字", example: "甲骨文是中国最早的文字之一。", bg: "#EFEBE9" },
  "水煮鱼": { emoji: "🐟🌶️💧🔥", scene: "鱼在辣椒汤里煮得热气腾腾", meaning: "用水煮的鱼，一道菜", memory: "水+煮+鱼=用热水煮的鱼，实际上还很辣哦", example: "四川的水煮鱼又辣又好吃。", bg: "#FFEBEE" },
  "碧空如洗": { emoji: "🌤️💙✨🧼", scene: "天空蓝得像刚被水洗过一样干净", meaning: "天空像洗过一样蓝", memory: "碧=青绿色，空=天空，如=好像，洗=洗干净——天蓝得像洗过", example: "今天碧空如洗，是个好天气。", bg: "#E3F2FD" },
  "万里无云": { emoji: "☀️🌤️🏔️👁️", scene: "蓝蓝的天空一望无际，一朵云都没有", meaning: "天上一片云都没有", memory: "万里=很远很远，无=没有，云=白云——远远望去，一朵云都看不到", example: "秋天的天空万里无云，真美！", bg: "#BBDEFB" },
  "动物": { emoji: "🐘🦁🐼🐒", scene: "动物园里各种可爱的动物", meaning: "会动的生物", memory: "\"动\"是会动的，\"物\"是东西——会动的东西就是动物", example: "我最喜欢的动物是大熊猫。", bg: "#C8E6C9" },
  "新奇": { emoji: "🤩🎊🔭🌟", scene: "第一次看到新东西，眼睛发光", meaning: "新鲜而有趣", memory: "\"新\"是以前没见过的，\"奇\"是奇妙——又新又奇妙的感觉", example: "小朋友对什么都感到新奇。", bg: "#E1F5FE" },
  "市场": { emoji: "🏪🛒🍎🐟", scene: "热热闹闹的菜市场，各种蔬菜水果", meaning: "买卖东西的地方", memory: "\"市\"是做买卖，\"场\"是地方——做买卖的地方就是市场", example: "妈妈带我去市场买水果。", bg: "#FFF8E1" },
  "夺目": { emoji: "👀✨💎🌟", scene: "一颗闪闪发亮的钻石让人移不开眼睛", meaning: "光彩照人，很吸引目光", memory: "\"夺\"是抢走，\"目\"是眼睛——漂亮得抢走了你的目光", example: "晚会上，她穿的裙子光彩夺目。", bg: "#F3E5F5" },
  "力量": { emoji: "💪🦸‍♂️⚡🏋️", scene: "超人举起巨石，充满力量", meaning: "力气，能量", memory: "\"力\"和\"量\"都是力气的意思——大大的力气就是力量", example: "团结就是力量。", bg: "#E8EAF6" },
  "微笑": { emoji: "😊🌸💛", scene: "轻轻弯起嘴角，温柔地笑", meaning: "轻轻地笑", memory: "\"微\"是一点点，\"笑\"是笑——微微地笑，不出声的温柔笑容", example: "老师总是微笑着看着我们。", bg: "#FFF9C4" },
  "古迹": { emoji: "🏛️🏰🧱📷", scene: "古老的城墙和宫殿，历史悠久", meaning: "古代留下来的建筑", memory: "\"古\"是很久以前，\"迹\"是痕迹——古人留下的痕迹和建筑", example: "长城是中国最有名的古迹。", bg: "#EFEBE9" },
  "传统": { emoji: "🧧🎎🏮📿", scene: "过年贴对联、放鞭炮，一代传一代", meaning: "一代一代传下来的习惯", memory: "\"传\"是传下去，\"统\"是一直——从古到今一直传下来的习惯", example: "春节是中国的传统节日。", bg: "#FFEBEE" },
  "节日": { emoji: "🎉🧧🎆🎊", scene: "放烟花、吃美食、全家团聚", meaning: "庆祝的日子", memory: "一年中特别的日子，大家一起庆祝——就是节日", example: "中秋节是我最喜欢的节日。", bg: "#FFF3E0" },
  "团圆": { emoji: "👨‍👩‍👧‍👦🌕🥮💕", scene: "全家人围坐在一起吃月饼赏月亮", meaning: "分开的人又聚在一起", memory: "\"团\"是围在一起，\"圆\"是圆圆的——像圆月亮一样大家围在一起", example: "中秋节是全家团圆的日子。", bg: "#FCE4EC" },
  "热闹": { emoji: "🎪🎶👨‍👩‍👧‍👦🎭", scene: "街上人山人海，唱歌跳舞好开心", meaning: "很多人很开心的样子", memory: "又热烈又热闹——人多+声音多+很开心=热闹", example: "过年的时候，街上可热闹了。", bg: "#FFF9C4" },
  "指南针": { emoji: "🧭🗺️↗️🌍", scene: "一个指针永远指着南方的神奇工具", meaning: "能指出南北方向的工具", memory: "\"指\"=指向，\"南\"=南方，\"针\"=指针——指向南方的针", example: "古代的人用指南针辨别方向。", bg: "#E0F7FA" },
  "造纸术": { emoji: "📜🌿🔨💧", scene: "把树皮和竹子捣碎，做成一张张白纸", meaning: "古代发明的造纸方法", memory: "\"造\"=制造，\"纸\"=纸张，\"术\"=方法——制造纸的方法", example: "蔡伦改进了造纸术，让更多人能写字读书。", bg: "#E8F5E9" },
};

const DEFAULT_WORD_DATA = {
  emoji: "📝✏️📖", scene: "打开书本，认真学习新词语",
  meaning: null, memory: "仔细看看这个词的每个字，想想它们组合在一起是什么意思",
  example: null, bg: "#F5F5F5",
};

function WordCard({ word, onSpeak, sc }) {
  const data = WORD_DATA[word] || DEFAULT_WORD_DATA;
  const meaning = data.meaning || `"${word}"是一个常用词语`;
  const example = data.example || `我学会了"${word}"这个词。`;

  const sceneAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    sceneAnim.setValue(0);
    cardAnims.forEach((a) => a.setValue(0));

    Animated.timing(sceneAnim, {
      toValue: 1, duration: 500, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true,
    }).start();

    Animated.stagger(120, cardAnims.map((a) =>
      Animated.timing(a, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true })
    )).start();
  }, [word]);

  const sceneStyle = {
    opacity: sceneAnim,
    transform: [{ scale: sceneAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
  };

  const sectionStyle = (i) => ({
    opacity: cardAnims[i],
    transform: [{ translateY: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  });

  return (
    <View style={st.card}>
      <Animated.View style={[st.wordSceneBox, { backgroundColor: data.bg }, sceneStyle]}>
        <Text style={st.wordSceneEmoji}>{data.emoji}</Text>
        <Text style={st.wordSceneDesc}>{data.scene}</Text>
      </Animated.View>

      <TouchableOpacity onPress={() => onSpeak(word)} activeOpacity={0.7}>
        <Text style={st.bigWord}>{word}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[st.speakBtn, { backgroundColor: sc.bg }]} onPress={() => onSpeak(word)}>
        <Text style={[st.speakTxt, { color: sc.primary }]}>🔊 点击朗读</Text>
      </TouchableOpacity>

      <Animated.View style={[st.meaningBox, { backgroundColor: sc.bg, marginTop: 20 }, sectionStyle(0)]}>
        <Text style={st.meaningLabel}>📖 词义</Text>
        <Text style={st.meaningTxt}>{meaning}</Text>
      </Animated.View>

      <Animated.View style={[st.wordMemoryBox, sectionStyle(1)]}>
        <Text style={st.meaningLabel}>🧠 记忆小助手</Text>
        <Text style={st.wordMemoryTxt}>{data.memory}</Text>
      </Animated.View>

      <Animated.View style={[st.wordExampleBox, sectionStyle(2)]}>
        <Text style={st.meaningLabel}>✏️ 造句</Text>
        <View style={st.wordExampleRow}>
          <Text style={st.wordExampleTxt}>{example}</Text>
          <TouchableOpacity onPress={() => onSpeak(example)} style={st.miniSpeak}>
            <Text style={{ fontSize: 18 }}>🔊</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View style={[st.wordCharBreakBox, sectionStyle(3)]}>
        <Text style={st.meaningLabel}>🔤 拆字理解</Text>
        <View style={st.wordCharRow}>
          {word.split('').map((ch, i) => (
            <TouchableOpacity key={i} onPress={() => onSpeak(ch)} style={st.wordCharItem}>
              <Text style={st.wordCharBig}>{ch}</Text>
              <Text style={st.wordCharHint}>点击听读音</Text>
            </TouchableOpacity>
          ))}
          <View style={st.wordCharPlus}>
            <Text style={st.wordCharPlusSign}>=</Text>
          </View>
          <View style={st.wordCharResult}>
            <Text style={st.wordCharBig}>{word}</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  back: { fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  headerProg: { fontSize: 14, fontWeight: '600', color: C.textMid },
  progBar: { height: 4, backgroundColor: C.border, marginHorizontal: 16, borderRadius: 2 },
  progFill: { height: 4, borderRadius: 2 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
  card: {
    backgroundColor: C.card, borderRadius: RADIUS, padding: 24,
    borderTopWidth: 4, borderTopColor: '#338F9B',
  },
  pinyin: { fontSize: 22, fontWeight: '600', color: '#EB9F4A', textAlign: 'center', marginBottom: 4 },
  bigChar: { fontSize: 80, fontWeight: '900', color: C.text, textAlign: 'center', lineHeight: 100 },
  bigWord: { fontSize: 48, fontWeight: '900', color: C.text, textAlign: 'center', lineHeight: 64, marginVertical: 8 },
  speakBtn: {
    alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, marginTop: 8,
  },
  speakTxt: { fontSize: 15, fontWeight: '600' },
  strokeSection: { marginTop: 20, alignItems: 'center' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 10 },
  wordRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(229,229,229,0.4)', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 6,
  },
  wordText: { fontSize: 20 },
  wordHighlight: { fontSize: 26, fontWeight: '900', color: '#E06B6B' },
  wordNormal: { fontSize: 20, fontWeight: '500', color: C.text },
  miniSpeak: { padding: 4 },
  meaningBox: {
    borderRadius: 12, padding: 14, marginTop: 16,
  },
  meaningLabel: { fontSize: 14, fontWeight: '700', color: C.textMid, marginBottom: 4 },
  meaningTxt: { fontSize: 16, lineHeight: 24, color: C.text },
  navRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, gap: 10,
    borderTopWidth: 1, borderColor: C.border,
  },
  navBtn: {
    flex: 1, height: 48, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card,
  },
  navBtnOff: { opacity: 0.4 },
  navBtnTxt: { fontSize: 15, fontWeight: '700', color: C.text },
  navBtnTxtW: { fontSize: 15, fontWeight: '700', color: '#fff' },
  doneBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  doneEmoji: { fontSize: 64, marginBottom: 12 },
  doneTitle: { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 8 },
  doneDesc: { fontSize: 16, color: C.textMid, marginBottom: 24 },
  doneBtn: {
    width: '100%', height: 52, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  doneBtnTxt: { fontSize: 17, fontWeight: '700', color: '#fff' },
  doneBtnSec: {
    width: '100%', height: 48, borderRadius: RADIUS,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.card,
  },
  doneBtnSecTxt: { fontSize: 15, fontWeight: '700' },

  wordSceneBox: {
    borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center',
  },
  wordSceneEmoji: { fontSize: 42, letterSpacing: 8, marginBottom: 6 },
  wordSceneDesc: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },

  wordMemoryBox: {
    borderRadius: 12, padding: 14, marginTop: 12,
    backgroundColor: '#FFFDE7', borderLeftWidth: 4, borderLeftColor: '#FFB300',
  },
  wordMemoryTxt: { fontSize: 15, lineHeight: 24, color: '#5D4037' },

  wordExampleBox: {
    borderRadius: 12, padding: 14, marginTop: 12,
    backgroundColor: '#E8F5E9', borderLeftWidth: 4, borderLeftColor: '#43A047',
  },
  wordExampleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  wordExampleTxt: { fontSize: 16, lineHeight: 24, color: '#2E7D32', flex: 1 },

  wordCharBreakBox: {
    borderRadius: 12, padding: 14, marginTop: 12,
    backgroundColor: '#F3E5F5', borderLeftWidth: 4, borderLeftColor: '#8E24AA',
  },
  wordCharRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    flexWrap: 'wrap', gap: 8, marginTop: 8,
  },
  wordCharItem: {
    alignItems: 'center', backgroundColor: '#fff', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  wordCharBig: { fontSize: 28, fontWeight: '800', color: '#4A148C' },
  wordCharHint: { fontSize: 10, color: '#9C27B0', marginTop: 2 },
  wordCharPlus: { paddingHorizontal: 4 },
  wordCharPlusSign: { fontSize: 22, fontWeight: '700', color: '#8E24AA' },
  wordCharResult: {
    alignItems: 'center', backgroundColor: '#E1BEE7', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 14,
  },
});
