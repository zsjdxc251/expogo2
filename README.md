# 学习乐园 LearnPark

一款面向小学二年级的多学科学习应用，涵盖数学、英语、语文三大科目，内置游戏化积分与成就体系，适合儿童日常练习使用。

## 功能概览

### 数学

| 题型 | 说明 |
|------|------|
| 乘法口诀（顺着背 / 挖空背） | 2\~9 的乘法，区分顺背与填空 |
| 加法 / 减法 | 支持简单、普通、困难三级难度 |
| 整除计算 | 42 ÷ 6 = ? |
| 余数除法 | 同时填写商和余数 |
| 反向除法 | 给出商和除数，求最大被除数与余数 |
| 应用题 | 30+ 种贴近课本的文字题模板 |
| 口算竞速 | 60 秒限时挑战，含 100 以内加减与九九乘除 |

- 三级难度（简单 / 普通 / 困难），家长可锁定可选等级
- 倒计时 / 正计时模式，秒级手动输入
- 加权出题算法，优先覆盖低频题目

### 英语

- 涵盖代词、名词、介词、be 动词、情态动词等多类语法
- 分初级 / 中级 / 高级三个等级
- **学习模式**：知识点讲解 + 例句 + TTS 朗读
- **练习模式**：选择题与填空题

### 语文

- **二年级下册课本内容**，含全部 25 课 + 语文园地
- 识字表（465 字）：emoji 场景画 · 释义 · 组词 · 记忆小助手 · 造句 · 偏旁拆字拼图动画
- 写字表（250 字）：田字格笔顺演示 + 上述全部辅助模块
- 词语表（240 词）：emoji 场景 · 拆字分析 · 记忆技巧 · 例句 · TTS 朗读
- 课本听写模式（写字表 / 词语表分别支持）

### 游戏化系统

- **积分与等级**：答对得分、全对额外奖励（≥10 题），家长可配置分值
- **每日任务**：每天 3\~5 个小任务，完成可得额外积分
- **成就徽章**：连击达人、全科冠军、坚持学习等
- **连击特效**：粒子动画 + 音效（答对叮声、连击 combo、升级庆祝）
- **32 款可选头像**

### 家长管理

- PIN 密码验证入口
- 科目 / 题型级别的可见性开关
- 难度等级权限设置
- 积分奖励参数配置
- 每日任务奖励配置
- 休息时间设置（默认 20 分钟触发 5 分钟强制休息，可 PIN 解锁）
- 积分重置

### 其他

- 练习中途退出确认（退出不得分）
- 错题回顾与历史记录
- 护眼休息页（眼保健操引导动画）
- Safe Area 适配（刘海屏 / 灵动岛）
- 中文 / 英文 TTS 自动切换

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Expo SDK 54 · React 19 · React Native 0.81 |
| 导航 | React Navigation（Stack + Bottom Tabs） |
| 状态管理 | React Context（AppContext） |
| 持久化 | AsyncStorage |
| 语音 | expo-speech（中英文 TTS） |
| 音效 | expo-av |
| 笔顺 | @jamsch/react-native-hanzi-writer + react-native-svg |
| 动画 | React Native Animated API |
| 安全区 | react-native-safe-area-context |

## 快速开始

```bash
npm install
npx expo start
```

使用 Expo Go 扫码即可在手机上运行。

## 项目结构

```
App.js                    # 入口，GestureHandler + SafeArea + Navigation
lib/
  AppContext.js            # 全局状态（积分、历史、配置）
  questions.js             # 数学出题引擎（含加权算法）
  english.js / eng-level*.js  # 英语题库与学习内容
  chinese.js               # 语文拼音/识字/组词题库
  textbookData.js          # 课本数据层（识字表/写字表/词语表）
  _charDict.js             # 669 字完整字典（emoji/组词/释义/记忆/造句/偏旁）
  _vocabRaw.js             # 课本词语原始数据
  points.js / dailyTasks.js / sounds.js / storage.js / theme.js
components/
  StrokeAnimation.js       # 田字格笔顺演示
  CharPuzzle.js            # 偏旁拆字拼图动画
  Feedback.js / NumberPad.js / PinModal.js / ...
screens/
  HomeScreen.js            # 主页（科目切换 + 题型选择）
  QuizScreen.js            # 数学练习
  EnglishQuizScreen.js / EnglishLearnScreen.js
  ChineseQuizScreen.js / ChineseLearnScreen.js
  TextbookSetupScreen.js / TextbookLearnScreen.js / TextbookDictationScreen.js
  SpeedChallengeScreen.js  # 口算竞速
  DictationScreen.js       # 英语/语文听写
  ResultsScreen.js / HistoryScreen.js / SettingsScreen.js / ...
navigation/
  RootNavigator.js         # Stack 导航
  MainTabs.js              # 底部 Tab 导航
```
