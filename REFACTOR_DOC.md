# 学习乐园 — 重构复刻文档

> 本文档完整梳理了「学习乐园」App 的所有功能模块、交互逻辑、数据结构和业务细节，  
> 目标是让开发者可以依据此文档在**微信小程序**（或其他平台）上 1:1 复刻全部功能。

---

## 一、应用概览

| 项目 | 说明 |
|------|------|
| 应用名 | 学习乐园 |
| 目标用户 | 小学二年级学生（含家长管理角色） |
| 核心定位 | 数学 + 英语 + 语文三科综合学习练习平台 |
| 数据存储 | 纯本地存储，无后端服务器 |
| 网络依赖 | 仅汉字笔画数据（jsDelivr CDN）和音效文件（Mixkit CDN） |

### 1.1 核心特性清单

- 13 种数学题型（口诀、加减乘除、余数、应用题、找规律等）
- 语文三级体系（拼音/识字/组词，含课文学习+听写+背诵）
- 课文同步学习（识字表/写字表/词语表）
- 汉字笔画动画演示
- 60秒口算竞速挑战
- 听写模式（英语/语文）
- 课文背诵闯关（朗读/挖空/首字提示）
- 积分等级系统 + 成就体系
- 每日任务系统（可配置强制任务）
- 家长PIN密码管控
- 用眼休息提醒（兔子护眼操）
- 错题本复习
- 积分管理（家长可手动增减）

---

## 二、页面结构与导航

### 2.1 导航架构

```
App（根）
├── GestureHandlerRootView
│   └── SafeAreaProvider
│       └── AppProvider（全局状态）
│           └── NavigationContainer
│               └── RootNavigator（NativeStack）
│                   ├── 未登录 → WelcomeScreen
│                   └── 已登录
│                       ├── Main → MainTabs（BottomTabs）
│                       │   ├── Home（主页）
│                       │   ├── History（积分记录）
│                       │   └── Settings（家长设置，PIN保护）
│                       ├── Quiz（数学练习）
│                       ├── EngLearn（英语学习）
│                       ├── EngQuiz（英语练习）
│                       ├── ChnLearn（语文学习）
│                       ├── ChnQuiz（语文练习）
│                       ├── Speed（口算竞速）
│                       ├── Dictation（听写）
│                       ├── TextbookSetup（课文选课）
│                       ├── TextbookLearn（课文学习）
│                       ├── TextbookDictation（课文听写）
│                       ├── CharTable（字表学习）
│                       ├── CharPractice（看字选拼音）
│                       ├── Recitation（背诵闯关）
│                       ├── Battle（对战模式）
│                       └── Results（练习结果）
│
│ 全局覆盖层（在导航之上）：
├── BreakScreen（强制休息，覆盖全屏）
└── PinModal（家长密码弹窗）
```

### 2.2 页面转场动画

| 页面 | 动画 |
|------|------|
| Welcome | fade |
| Quiz/EngQuiz/ChnQuiz/Speed/Dictation/CharPractice/Battle | slide_from_bottom |
| Results | fade（禁用手势返回） |
| 其他 | slide_from_right（默认） |

### 2.3 底部Tab栏

| Tab | 标签 | 备注 |
|-----|------|------|
| Home | 主页 | 点击时自动退出家长模式 |
| History | 积分 | 点击时自动退出家长模式 |
| Settings | 家长 | 需要PIN验证才能进入 |

**Tab栏样式要点：**
- 浮动样式（position:absolute, bottom:0, left:16, right:16）
- 圆角顶部（borderTopLeftRadius=20, borderTopRightRadius=20）
- 背景色 `#7BAE8E`，高度64
- 页面内容需要paddingBottom:80来避免被遮挡

**Settings Tab的PIN保护逻辑：**
1. 点击Settings Tab时，如果不在家长模式：
   - 若未设置PIN → 弹出PIN设置弹窗（setup模式）
   - 若已设置PIN → 弹出PIN验证弹窗（verify模式）
2. PIN验证成功后 → 进入家长模式 → 自动跳转到Settings Tab
3. 点击其他Tab → 自动退出家长模式
4. 未通过验证时，Settings页面显示"🔒 请验证家长密码"占位页

---

## 三、全局状态管理（AppContext）

### 3.1 状态字段

```javascript
{
  // 加载状态
  ready: Boolean,          // 初始化完成标记
  hasUser: Boolean,        // 是否已创建用户
  
  // 用户数据
  user: {
    name: String,          // 昵称（最长8字符）
    avatar: String,        // emoji头像
    createdAt: ISO String,
    totalPoints: Number,   // 总积分
    level: Number,         // 当前等级
    settings: { autoSubmit: Boolean },  // 是否自动提交答案
    breakConfig: { usageMinutes: Number, breakMinutes: Number },
    rewardConfig: { perCorrect: Number, perfectBonus: Number, taskReward: Number },
    visibility: { math: Boolean, english: Boolean, chinese: Boolean, math_speed: Boolean, math_mulForward: Boolean, ... allowedDifficulties: ['easy','normal','hard'] },
    parentPin: String,     // 4位家长密码
    taskConfig: { enabled: Boolean, tasks: [{ subject, count, label }] },
  },
  
  // 练习记录
  history: [{
    id: String,
    subject: String,       // 科目标识
    difficulty: String,
    date: ISO String,
    total: Number,
    correct: Number,
    wrong: Number,
    elapsed: Number,       // 秒
    pointsEarned: Number,
    accuracy: Number,      // 0-100
    wrongList: Array,      // 错题列表
  }],
  
  // 成就
  achievements: { [achId]: { unlocked: true, date: ISO String } },
  
  // 连续打卡
  streak: { count: Number, lastDate: 'YYYY-MM-DD' },
  
  // 每日任务
  dailyTasks: [{
    id: String, tpl: String, type: String,
    text: String, target: Number,
    progress: Number, completed: Boolean,
  }],
  
  // 不熟悉的字
  unfamiliarChars: [String],  // 汉字数组
  
  // 积分日志
  pointsLog: [{
    id: String, type: 'add'|'subtract',
    amount: Number, reason: String, note: String,
    date: ISO String, balance: Number,
    source: 'quiz'|undefined, subject: String|undefined,
  }],
  
  // 练习结果（跨页面传递）
  quizResult: Object,
  lastQuizRoute: { routeName: String, params: Object },
  
  // PIN相关
  showPin: Boolean,
  pinMode: 'setup'|'verify',
  isParent: Boolean,
  
  // 休息提醒
  showBreak: Boolean,
}
```

### 3.2 初始化流程（App启动时）

1. 并行加载：用户数据、练习记录、成就、连续打卡
2. 预加载音效（4个远程MP3文件）
3. 预加载数学题频率缓存
4. 如果用户存在：
   - 加载每日任务（根据日期判断是否需要重新生成）
   - 加载不熟悉的字
   - 加载积分日志
5. 设置 `ready = true`

### 3.3 用眼休息计时逻辑

- 每10秒检查一次连续使用时长
- 超过 `breakConfig.usageMinutes`（默认20分钟）→ 显示休息屏幕
- 休息结束后重置计时器
- 练习完成后也会检查，如果超时则1.5秒后触发休息
- 家长可通过PIN提前解锁休息屏幕

### 3.4 核心方法

| 方法 | 功能 |
|------|------|
| `createUser({name, avatar})` | 创建用户，初始化所有默认配置 |
| `updateUser(patch)` | 更新用户字段，如修改了taskConfig则重建任务 |
| `resetAll()` | 清除所有数据，回到欢迎页 |
| `finishQuiz(data)` | **核心方法** — 完成练习后的积分计算、记录保存、成就检查、任务进度更新 |
| `recordLearning(subject)` | 学习模式完成时记录（不计入练习记录，但更新任务进度） |
| `buildErrorReview()` | 从历史记录中提取所有错题，去重打乱 |
| `toggleUnfamiliar(char)` | 切换"不熟悉"标记 |
| `adjustPoints(type, amount, reason, note)` | 家长手动调整积分 |
| `requestPin(mode)` | 请求打开PIN弹窗 |
| `requestBreakUnlock()` | 休息时请求家长解锁 |

---

## 四、积分等级系统

### 4.1 等级定义

| 等级 | 所需积分 | 称号 |
|------|---------|------|
| Lv.1 | 0 | 数学新手 |
| Lv.2 | 200 | 计算小兵 |
| Lv.3 | 500 | 数学战士 |
| Lv.4 | 1000 | 算术达人 |
| Lv.5 | 2000 | 数学大师 |
| Lv.6 | 5000 | 超级学霸 |

### 4.2 积分计算规则

```
积分 = 答对题数 × perCorrect（默认5）
如果全对 且 题数 ≥ 10题 → 额外加 perfectBonus（默认10）
每完成一个每日任务 → 加 taskReward（默认10）
完成休息 → 奖励 10 积分
```

### 4.3 成就系统

| ID | 名称 | 条件 | 图标 |
|----|------|------|------|
| first | 首次出征 | 完成第一次练习 | 🎯 |
| perfect | 完美通关 | 任一次练习全对 | ⭐ |
| speed | 闪电侠 | 20题60秒内完成 | ⚡ |
| streak3 | 坚持不懈 | 连续3天练习 | 🔥 |
| allSubjects | 全科冠军 | 数学+英语+语文各至少1次 | 🏆 |
| pts1000 | 千分王 | 累计积分≥1000 | 👑 |

### 4.4 连续打卡逻辑

```
如果 lastDate === 今天 → 不更新
如果 lastDate === 昨天 → count + 1
否则 → count 重置为 1
```

---

## 五、每日任务系统

### 5.1 任务模板库（默认随机模式）

| 模板 | 类型 | 描述 | 目标 |
|------|------|------|------|
| math_all | math | 完成10道数学题 | 10 |
| math_add | math | 完成5道加法题 | 5 |
| math_mul | math | 完成5道乘法题 | 5 |
| math_div | math | 完成5道除法题 | 5 |
| eng_learn | eng | 学习1个英语知识点 | 1 |
| eng_quiz | eng | 完成5道英语题 | 5 |
| chn_learn | chn | 学习1个语文知识点 | 1 |
| chn_quiz | chn | 完成5道语文题 | 5 |
| speed | speed | 完成1次口算竞速 | 1 |
| dictation | dictation | 完成1次听写练习 | 1 |

### 5.2 任务生成规则

- **默认模式**：每天随机抽取4个任务（尽量不同类型）
- **家长配置模式**：家长在设置中指定具体科目和题数
- 任务按日期缓存，同一天不重新生成
- 如果家长切换了配置（启用/禁用/修改任务列表），立即重建

### 5.3 任务进度匹配

每完成一次练习，遍历所有未完成任务：
- 通过 `MATCHERS` 判断该练习的 subject 是否匹配任务模板
- 匹配则累加 `progress += record.total`
- 当 `progress >= target` 时标记完成

### 5.4 任务锁定逻辑

当 `taskConfig.enabled === true` 且并非所有任务都已完成时：
- 主页显示锁定提示（红色边框，"🔒 未完成"标签）
- 点击非任务相关的练习 → 弹出锁定提示模态框
- 只允许进入与任务相关的科目
- 锁定提示弹窗提供"去做任务"按钮，自动导航到第一个未完成任务

---

## 六、各功能模块详解

### 6.1 欢迎页（WelcomeScreen）

**流程：**
1. 输入名字（1-8字符）
2. 从32个emoji中选择头像
3. 两项都完成后"开始冒险"按钮激活
4. 点击后调用 `createUser` → 自动进入主页

**头像列表：**
```
🚀🤖🦖🦁🦅👨‍🚀🐶🐱🐼🐨🦊🐸🐵
🦄🐢🐬🦋🐝🐘🦜🏀⚽🎸🎨🌈🌻🍀
🍎🧁🎪🎠🏰
```

### 6.2 主页（HomeScreen）

**布局结构（从上到下）：**

1. **头部信息栏**
   - 左侧：头像emoji + 昵称 + 等级徽章（`Lv.X 称号`）
   - 右侧：🔥连续天数 + 💎总积分

2. **经验条**
   - 显示当前等级到下一等级的进度
   - 文本："还需 X XP 升级"

3. **每日任务卡片**（如果有任务）
   - 标题：📋 今日任务 + 完成数/总数 + 展开/收起
   - 如果任务未全部完成且已启用强制：红色边框+🔒标记
   - 每个任务显示：完成图标 + 描述文本 + 进度条 + GO按钮
   - 点击任务自动导航到对应练习页面

4. **三大科目卡片**
   - 数学📐 / 英语📖 / 语文📝
   - 每个显示圆环进度百分比
   - 可根据家长配置隐藏某些科目
   - 点击切换下方内容区域

5. **科目Tab切换栏**
   - 与上方三大卡片联动

6. **智能推荐练习**
   - 根据历史记录找出正确率最低的知识点
   - 显示"🎯 推荐练习 — XXX 正确率最低"

7. **科目内容区域**
   - 数学Tab：13种题型网格 + 口算竞速 + 比赛模式
   - 英语Tab：
   - 语文Tab：课文学习/听写入口 + 背诵闯关入口 + 三级知识点折叠面板

8. **成就区域**（可折叠）
   - 显示已解锁/未解锁成就图标

**进度计算方式：**
- 某科目整体进度 = 所有子主题平均正确率之和 / 子主题总数
- 单个主题进度 = 该主题所有练习记录的平均正确率

### 6.3 数学练习（QuizScreen）

#### 6.3.1 设置阶段

**可配置项：**
- **难度**：简单(2-5) / 普通(2-7) / 困难(2-9) — 家长可限制可选难度
- **题数**：支持 ±1/±5 调节 + 预设快捷按钮(10/20/30/最大)
- **计时模式**：
  - 计时模式（正计时，记录用时）
  - 倒计时模式（预设60/120/180/300秒 或 自定义输入，支持±10/±30调节）

#### 6.3.2 答题阶段

**界面元素：**
- 顶部：返回按钮 + 计时器 + 题号进度（X/N）
- 进度条（颜色随科目变化）
- 连击显示（≥3连对时显示 🔥 连击 xN!）
- 题目卡片区域
- 自定义数字键盘（1-9, 0, C清空, ⌫退格）
- 确认按钮（或自动提交模式下无需）

**题目展示逻辑：**

| 题型 | 展示方式 |
|------|---------|
| 普通算式（加减乘除） | `X ○ Y = ?` 或 `? ○ Y = Z` 等，缺失位用虚线框 |
| 余数除法(divRem) | `A ÷ B = [商] ... [余]` — 双输入框，点击切换焦点 |
| 反推除法(divReverse) | `[被除数] ÷ B = C ... [余]` — 双输入框 |
| 乘法反推(mulReverse) | MCQ选择题："哪个乘法等于36?" + 4个选项 |
| 比大小(compare) | MCQ："3×4 ___ 2×7" + 3个选项(> < =) |
| 应用题(wordProblem) | 文字题干 + 单输入框 |
| 找规律(pattern) | 数列 + 单输入框 |

**答题反馈机制：**
1. 回答后立即显示 Feedback 组件：
   - 正确：绿色 ✓ 圆圈 + 粒子特效（8个彩色圆点飞散）+ "+X"积分浮动文字
   - 错误：红色 ✗ 圆圈 + 左右抖动动画
2. 音效：正确/错误/连击各有独立音效
3. 连击 ≥3：额外播放combo音效，连击数字弹跳放大动画
4. 连击等级：≥3 FIRE / ≥5 LIGHTNING / ≥10 RAINBOW（不同颜色粒子）
5. 错误时显示解题提示（💡 提示框，仅数学题）
6. 连续错误 ≥3次：显示鼓励文字（"没关系，错误是学习的好朋友！"等4条轮换）

**自动提交逻辑（可在设置中开启）：**
- 输入位数等于答案位数时，延迟250ms自动提交
- 双输入框题：两个输入框都满足位数要求时，延迟350ms自动提交

**倒计时到0逻辑：**
- 立即停止计时
- 未答的题算未答（answer=null）
- 自动触发 finishQuiz

**退出保护：**
- 答题中按返回 → 弹出确认弹窗："确认离开？已做的题目不会被记录"
- 系统返回手势同样拦截

#### 6.3.3 十三种数学题型生成逻辑

| 题型 | 生成规则 |
|------|---------|
| mulForward(顺着背) | a×b=? 在range内遍历所有组合 |
| mulBlank(挖空背) | a×b=c 随机挖左或右 |
| add(加法) | a+b=c 随机挖左/右/结果 |
| subtract(减法) | (a+b)-a=b 确保不出负数 |
| divide(整除) | (a×b)÷a=b |
| divRem(余数除法) | a÷b=q...r 双输入 |
| divReverse(反推除法) | ?÷b=q...? 求最大被除数和余数 |
| addTwo(两位数加法) | 10-99范围的加法 |
| subtractTwo(两位数减法) | 确保被减数>减数 |
| mulReverse(乘法反推) | "哪个等于36?" 4选1 |
| compare(比大小) | 两个乘法表达式比较 > < = |
| wordProblem(应用题) | 30+种模板，含加减乘除/找零/余数/倍数/间隔等 |
| pattern(找规律) | 等差/等比数列 |

**智能出题（加权选择）：**
- 维护每道题的出现频率（AsyncStorage缓存）
- 低频题优先被选中（`权重 = 最大频率 + 1 - 该题频率`）
- 每次练习后更新频率计数

### 6.4 口算竞速（SpeedChallengeScreen）

**设置阶段：**
- 选择难度（简单/普通/困难）
- 显示历史最佳记录

**竞速阶段：**
- 60秒倒计时
- 题目混合：加法30题 + 减法30题 + 乘法30题 + 除法30题，打乱顺序
- 输入位数达到答案位数时**自动判定**（无需确认按钮）
- 正确：播放音效，计数+1，立即下一题
- 错误：播放音效，300ms后下一题（不加分）
- 连击≥3：播放combo音效+弹跳动画
- 计时条颜色：>20秒绿色 / 10-20秒橙色 / <10秒红色

**结果阶段：**
- 显示答对题数
- 与历史最佳对比
- 如果刷新记录则显示"🏆 新纪录!"
- 记录保存到AsyncStorage(`@speed_best`)
- 同时调用 finishQuiz 记录练习数据

### 6.7 语文学习与练习

#### 6.7.1 三级体系

| 级别 | 主题 |
|------|------|
| 拼音(pinyin) | 声母/韵母/整体认读/声调/拼读练习 |
| 识字(literacy) | 高频字/偏旁部首/形近字/多音字 |
| 组词(words) | 词语搭配/反义词/近义词/量词/造句练习 |

#### 6.7.2 学习和练习模式
- 与英语类似，学习卡片+选择题练习
- 语文题目的 subject 前缀为 `chn_`（如 `chn_shengmu`）

#### 6.7.3 识字表数据
- 6组识字单元，每组10-12个汉字
- 每个字包含：字(char) + 拼音(pinyin)
- 用于"看字选拼音"练习

### 6.8 课文同步学习

#### 6.8.1 课文设置页（TextbookSetupScreen）

**选择流程：**
1. 选择表类型：识字表(shizi) / 写字表(xiezi) / 词语表(ciyu)
2. 选择课文（支持全选/多选）
3. 显示已选总字数/词数
4. 学习模式 → TextbookLearn / 听写模式 → TextbookDictation

#### 6.8.2 课文学习页（TextbookLearnScreen）
- 逐字/词翻阅学习
- 汉字笔画动画（通过 HanziWriter 组件，从 jsDelivr CDN 加载笔画JSON数据）
- 拼音显示
- TTS朗读（expo-speech）
- 组词/释义展示
- CharPuzzle 偏旁部首拼图动画

#### 6.8.3 字表页面（CharTableScreen）
- 5列网格展示字/词
- 翻牌式学习（正面显示字，背面显示拼音/释义）
- 翻牌动画（Y轴旋转）
- 点击🔊朗读
- "不熟悉"标记（❤️切换，标记后可专项复习）
- 底部显示不熟悉字数和操作按钮

#### 6.8.4 看字选拼音（CharPracticeScreen）
- 显示汉字，从4个拼音选项中选择正确的
- 干扰项生成：优先选同音不同调的拼音（去声调后相同），再选不同音的
- 完成后调用 finishQuiz

#### 6.8.5 课文听写（TextbookDictationScreen）
- TTS朗读一个字/词
- 显示/隐藏答案
- 自我判断对错
- 逐个推进

### 6.9 听写模式（DictationScreen）

**设置：** 选择题数（5/10/15/20）

**流程：**
1. 每题自动TTS朗读正确答案
2. 显示4个选项（A/B/C/D标签）
3. 选择后显示正确/错误
4. 错误时显示解释
5. 支持手动重复播放
6. 连击机制与数学练习相同

**英语听写：** 从前6个英语主题中各抽10题，语速0.8
**语文听写：** 从前5个语文主题中各抽10题，语速0.9

### 6.10 课文背诵闯关（RecitationScreen）

**关卡选择页：**
- 显示所有关卡列表
- 每关包含来源说明和内容标题预览
- 按类型着色：古诗(黄)/名言(绿)/课文(蓝)/常识(紫)/经典诵读(橙)

**背诵页面三种模式：**

1. **朗读模式**
   - 显示完整原文
   - "🔊 朗读全文"按钮
   - 点击任意一行可单独朗读
   - 正在朗读的行高亮显示
   
2. **挖空模式**
   - 随机挖去35%的汉字（显示为红色虚线框"?"）
   - 点击"?"显示该字（标绿+下划线）
   - "显示全部答案"按钮
   - "重新挖空"按钮

3. **首字提示模式**
   - 每行只显示第一个汉字（橙色高亮）
   - 其余汉字显示为下划线

**古诗译文功能：**
- 支持7首古诗的逐句白话翻译
- 可折叠/展开

**支持的背诵内容（recitationData）：**
- 古诗：咏柳、村居、绝句、赋得古原草送别、晓出净慈寺、悯农、江上渔者等
- 名言、课文段落、常识（如二十四节气歌）、经典诵读

### 6.11 练习结果页（ResultsScreen）

**布局（从上到下）：**

1. **正确率圆环**（大号，数字动画递增）
2. **表情反馈横幅**
   - ≥100%: 🏆 "全部答对！你太棒了！" + 👍动画（弹出+摇摆）
   - ≥80%: 🌟 "非常棒！再加把劲！"
   - ≥60%: 💪 "不错哦，继续努力！"
   - <60%: 🤗 "没关系，错误是进步的阶梯！"
3. **科目标签**
4. **统计行**：用时 | 正确数(绿色) | 错误数(红色)
5. **积分卡片**（滑入动画）
   - 显示总获得积分（含任务奖励）
   - 全对奖励显示（金色边框）
6. **升级动画**（如果升级：星星弹出 + 升级音效）
7. **新成就卡片**
8. **错题回顾**列表
   - 数学题：显示算式、你的答案(红)、正确答案(绿)
   - 英语/语文题：显示题干、选项、解释
   - 每题支持🔊朗读
9. **按钮**：返回主页 / 再来一次

**"再来一次"逻辑：** 使用 `lastQuizRoute` 记录上次的路由和参数，replace导航回去

### 6.12 积分记录页（HistoryScreen）

**布局：**
1. 当前积分大号显示
2. 错题本入口（显示总错题数，点击进入错题复习）
3. 积分日志列表（按时间倒序，最多200条）
   - 每条显示：图标+原因+正确率+备注+时间+变动+余额

**错题复习逻辑：**
- 从所有历史记录中提取 wrongList
- 去重（按题目唯一键）
- 打乱后作为新的练习题组导航到 QuizScreen

### 6.13 家长设置页（SettingsScreen）

**设置分区：**

1. **基本设置**
   - 自动提交开关
   - 修改昵称（行内编辑）
   - 修改头像（展开选择）

2. **休息提醒**
   - 使用时长：5-60分钟，步进5
   - 休息时长：1-15分钟，步进1

3. **积分设置**
   - 每题正确积分：1-50
   - 全对额外奖励：0-200，步进5
   - 任务完成奖励：1-100

4. **难度权限**
   - 简单/普通/困难 各可开关（至少保留一个）

5. **科目权限**
   - 数学总开关 + 13个子题型各自开关 + 口算竞速开关
   - 英语总开关
   - 语文总开关

6. **每日任务配置**
   - 强制任务开关
   - 已配置任务列表（可删除）
   - 添加任务：选择科目+设置题数(5-50，步进5)

7. **积分管理**
   - 当前积分显示
   - 增加/减少积分按钮 → 弹出Modal
   - 选择原因：兑现奖励🎁/做家务🧹/课外阅读📚/表现优秀⭐/违规扣分⚠️/其他📝
   - 输入数量+备注
   - 积分记录列表（可展开，显示最近20条）

8. **管理**
   - 重置积分（确认弹窗）
   - 修改家长密码
   - 重置所有数据（确认弹窗）

### 6.14 休息页面（BreakScreen）

**核心设计：兔子带你做眼操**

**眼操步骤（8步循环，每步8秒）：**

| 步骤 | 标签 | 故事文本 | 动画 |
|------|------|---------|------|
| 1 | 👆 向上看 | 🐰 小兔子抬头看天空的白云～ | 胡萝卜向上移动 |
| 2 | 👉 向右看 | 🐰 哇，右边有一只蝴蝶飞过！ | 胡萝卜向右移动 |
| 3 | 👇 向下看 | 🐰 低头看看地上的小花朵～ | 胡萝卜向下移动 |
| 4 | 👈 向左看 | 🐰 左边传来小鸟的歌声～ | 胡萝卜向左移动 |
| 5 | 🔭 看远处 | 🐰 远处的山好美啊～ | 胡萝卜缩小 |
| 6 | 👁️ 看近处 | 🐰 近处有一颗露珠！ | 胡萝卜放大 |
| 7 | 🔄 转圈看 | 🐰 转个圈看看～ | 胡萝卜绕圆转 |
| 8 | 😌 闭眼休息 | 🐰 闭上眼睛～ | 胡萝卜缩到消失 |

**界面元素：**
- 绿色主题背景(#E8F5E9)
- 顶部：弹跳的兔子emoji + 标题
- 中间：圆形护眼区域(220×220) + 🥕胡萝卜引导点 + 十字线
- 底部：倒计时 + 状态提示

**逻辑规则：**
- 休息期间不可关闭（显示"🔒 休息期间不可关闭"）
- 倒计时结束后：显示"🎉 休息完毕！" + 休息奖励(+10积分) + "继续学习"按钮
- 家长解锁：如果设置了parentPin，显示"家长解锁"按钮 → 弹出PIN验证

### 6.15 PIN密码弹窗（PinModal）

**两种模式：**

1. **设置模式(setup)**
   - 第一步：输入新密码（4位数字）
   - 第二步：确认密码
   - 不一致：抖动动画 + "两次输入不一致"错误提示 → 重新开始

2. **验证模式(verify)**
   - 输入4位密码
   - 错误：抖动动画 + "密码错误"
   - 自动在输入满4位后200ms判断

**UI特征：**
- 4个圆点指示器（未输入灰色，已输入主题色）
- 自定义3×4数字键盘
- 输入错误时整行圆点左右抖动

---

## 七、组件详解

### 7.1 NumberPad（数字键盘）

```
布局：3×4 网格
[1] [2] [3]
[4] [5] [6]
[7] [8] [9]
[清空] [0] [⌫]
```
- 按下时缩小到0.92倍（弹簧动画）
- 释放时恢复1倍
- 禁用态透明度0.35

### 7.2 Feedback（答题反馈）

- 正确：绿色圆✓ + 8个粒子飞散 + "+X"积分浮动 + 连击标签
- 错误：红色圆✗ + 左右抖动
- 动画时长800ms，结束后回调onDone
- 粒子颜色根据连击等级变化

### 7.3 ProgressRing（进度环）

- CSS border-radius 技巧实现的圆环进度
- 可自定义大小、线宽、颜色
- 中间可放置子元素（百分比文字）

### 7.4 PressableCard（按压卡片）

- 按下缩小效果的通用卡片包装器
- 圆角20

### 7.5 SpeakButton（朗读按钮）

- 调用 expo-speech 朗读指定文本
- 支持指定语言(zh-CN/en-US)
- 朗读中禁用

### 7.6 StrokeAnimation（笔画动画）

- 使用 @jamsch/react-native-hanzi-writer
- 笔画数据从 CDN 加载：`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/{char}.json`
- 支持自动播放/手动播放/重播

### 7.7 ExitConfirmModal（退出确认）

- 答题中退出弹出确认
- 提示"已做的题目不会被记录"
- 取消/确认按钮

---

## 八、数据存储

### 8.1 AsyncStorage 键值表

| Key | 内容 | 最大条数 |
|-----|------|---------|
| `@learnpark_user` | 用户信息JSON | 1 |
| `@learnpark_history` | 练习记录数组 | 200 |
| `@learnpark_ach` | 成就字典 | - |
| `@learnpark_streak` | 连续打卡 | 1 |
| `@learnpark_unfamiliar` | 不熟悉的字数组 | - |
| `@learnpark_points_log` | 积分日志数组 | 200 |
| `@learnpark_qfreq` | 题目频率缓存 | - |
| `@daily_tasks` | 每日任务（含日期） | - |
| `@speed_best` | 口算竞速最佳记录 | 1 |

### 8.2 数据迁移

支持从旧版Key(`@mathstar_*`)自动迁移到新Key(`@learnpark_*`)：
- 读取新Key → 如果不存在 → 读取旧Key → 存到新Key → 删除旧Key

---

## 九、音效系统

### 9.1 音效资源

| 音效 | URL |
|------|-----|
| correct | https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3 |
| wrong | https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3 |
| combo | https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3 |
| levelUp | https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3 |

### 9.2 播放逻辑
- App启动时预加载所有音效
- 播放前 seek 到开头（重用同一个Sound对象）
- 音量统一0.6
- iOS静音模式下仍播放(`playsInSilentModeIOS: true`)
- 所有播放错误静默处理

---

## 十、主题与样式

## 十一、微信小程序适配要点

### 11.1 技术对照

| 原技术 | 微信小程序替代 |
|--------|--------------|
| React Native | WXML + WXSS + JS (或 Taro/uni-app) |
| React Navigation | wx.navigateTo / wx.switchTab / 自定义TabBar |
| AsyncStorage | wx.setStorageSync / wx.getStorageSync |
| expo-speech | wx.createInnerAudioContext (需自行接TTS API) 或 插件 |
| expo-av | wx.createInnerAudioContext |
| Animated | wx.createAnimation / CSS animation |
| react-native-hanzi-writer | Canvas API + hanzi-writer-data JSON |
| Modal | 自定义遮罩层组件 |
| GestureHandler | touchstart/touchmove/touchend |

### 11.2 关键差异处理

1. **TTS语音合成**：微信小程序原生不支持TTS，需要：
   - 接入百度/讯飞等TTS API
   - 或使用微信同声传译插件

2. **汉字笔画动画**：
   - 使用 Canvas 组件
   - 仍可从 jsDelivr 加载笔画JSON数据
   - 自行实现笔画绘制逻辑

3. **音效播放**：
   - 使用 `wx.createInnerAudioContext()`
   - 需要将远程音效下载到本地或使用CDN

4. **动画系统**：
   - 简单动画用 CSS transition/animation
   - 复杂动画（粒子特效）用 Canvas 或 wx.createAnimation

5. **导航结构**：
   - TabBar → 自定义TabBar组件（支持PIN保护逻辑）
   - 全屏覆盖层（休息屏幕）→ 使用页面级z-index或独立页面

6. **全局状态**：
   - 使用小程序 globalData 或 Mobx/Redux
   - 或使用 Taro/uni-app 的状态管理

7. **PIN密码弹窗**：
   - 使用自定义组件实现
   - 注意输入框焦点管理

---

## 十二、数据字典（完整字段参考）

### 12.1 用户(User)

```json
{
  "name": "小明",
  "avatar": "🚀",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "totalPoints": 350,
  "level": 2,
  "parentPin": "1234",
  "settings": {
    "autoSubmit": false
  },
  "breakConfig": {
    "usageMinutes": 20,
    "breakMinutes": 5
  },
  "rewardConfig": {
    "perCorrect": 5,
    "perfectBonus": 10,
    "taskReward": 10
  },
  "visibility": {
    "math": true,
    "english": true,
    "chinese": true,
    "math_speed": true,
    "math_mulForward": true,
    "math_mulBlank": true,
    "math_add": true,
    "math_subtract": true,
    "math_divide": true,
    "math_divRem": true,
    "math_divReverse": true,
    "math_addTwo": true,
    "math_subtractTwo": true,
    "math_mulReverse": true,
    "math_compare": true,
    "math_wordProblem": true,
    "math_pattern": true,
    "allowedDifficulties": ["easy", "normal", "hard"]
  },
  "taskConfig": {
    "enabled": false,
    "tasks": [
      { "subject": "mulForward", "count": 10, "label": "顺着背" }
    ]
  }
}
```

### 12.2 练习记录(Record)

```json
{
  "id": "abc123def",
  "subject": "mulForward",
  "difficulty": "normal",
  "date": "2024-01-15T10:30:00.000Z",
  "total": 20,
  "correct": 18,
  "wrong": 2,
  "elapsed": 145,
  "pointsEarned": 90,
  "accuracy": 90,
  "wrongList": [
    {
      "left": 7, "right": 8, "result": 56,
      "op": "mulForward", "missingPos": "result",
      "answer": 56, "userAnswer": 54,
      "display": { "left": "7", "right": "8", "result": "" }
    }
  ]
}
```

### 12.3 积分日志(PointsLog Entry)

```json
{
  "id": "quiz_abc123def",
  "type": "add",
  "amount": 100,
  "reason": "练习 18/20",
  "note": "含任务奖励 +10",
  "date": "2024-01-15T10:32:00.000Z",
  "balance": 450,
  "source": "quiz",
  "subject": "mulForward"
}
```

### 12.4 每日任务(DailyTask)

```json
{
  "id": "math_a1b2",
  "tpl": "math_all",
  "type": "math",
  "text": "完成 10 道数学题",
  "target": 10,
  "progress": 7,
  "completed": false
}
```

---

## 十三、finishQuiz 完整流程（核心业务逻辑）

```
输入: { questions, answers, elapsed, subject, difficulty, maxCombo }

1. 计算正确数/错误数/错题列表
   - 支持对象型答案比较（余数除法等）

2. 计算积分
   pts = correct × perCorrect
   if (correct === total && total >= 10) pts += perfectBonus

3. 更新用户总积分和等级
   newTotal = totalPoints + pts
   level = 根据LEVELS表查找

4. 保存练习记录（插入到history数组头部，最多200条）

5. 更新连续打卡
   if (lastDate !== 今天):
     if (lastDate === 昨天) count++
     else count = 1

6. 检查成就解锁

7. 更新每日任务进度
   - 遍历任务，匹配subject
   - 累加progress
   - 新完成的任务 → 额外积分奖励

8. 记录积分日志（插入头部，最多200条）

9. 构建结果对象
   { ...record, pointsEarned, taskBonus, isPerfect, levelUp, newLevel, newAchievements }

10. 存入 quizResult 供 ResultsScreen 读取

11. 检查是否需要触发休息提醒
```

---

## 附录A：数学题型完整逻辑示例

> 本节为每种数学题型提供**生成算法伪代码 + 具体示例**，便于在任何平台上复刻。

### A.1 题型总览（13种）

| # | 题型 key | 中文名 | 输入方式 | 难度范围含义 |
|---|---------|--------|----------|-------------|
| 1 | `add` | 加法填空 | 数字键盘 | `[lo, hi]` 加数范围 |
| 2 | `subtract` | 减法填空 | 数字键盘 | `[lo, hi]` 被减数因子范围 |
| 3 | `mulForward` | 乘法正算 | 数字键盘 | `[lo, hi]` 乘数范围 |
| 4 | `mulBlank` | 乘法填空（缺因数） | 数字键盘 | `[lo, hi]` 乘数范围 |
| 5 | `mulReverse` | 乘法反推（选择题） | 4选1点选 | `[lo, hi]` 乘数范围 |
| 6 | `divide` | 整除 | 数字键盘 | `[lo, hi]` 除数/商范围 |
| 7 | `divRem` | 有余数除法（双输入） | 商+余数两个输入 | `[lo, hi]` 除数/商范围 |
| 8 | `divReverse` | 余数反推（双输入） | 被除数+余数 | `[lo, hi]` 除数/商范围 |
| 9 | `addTwo` | 两位数加法 | 数字键盘 | `[lo, hi]` 影响数值量级 |
| 10 | `subtractTwo` | 两位数减法 | 数字键盘 | `[lo, hi]` 影响数值量级 |
| 11 | `compare` | 乘法比较（选择题） | 3选1 `> < =` | `[lo, hi]` 乘数范围 |
| 12 | `wordProblem` | 应用题 | 数字键盘 | `[lo, hi]` 数值范围 |
| 13 | `pattern` | 找规律 | 数字键盘 | `[lo, hi]` 起始数范围 |

### A.2 基础四则运算示例

#### 加法 `add`
```
输入: range = [2, 9], count = 5
生成逻辑:
  for a in [lo..hi]:
    for b in [lo..hi]:
      pool.push({ left: a, right: b, result: a+b, op: 'add' })
  随机选 missingPos ∈ ['left', 'right'] → 缺哪个就填哪个

示例题目:
  □ + 5 = 12  → 答案: 7 (missingPos = 'left')
  3 + □ = 11  → 答案: 8 (missingPos = 'right')
```

#### 减法 `subtract`
```
输入: range = [2, 9]
生成逻辑:
  for a in [lo..hi]:
    for b in [lo..hi]:
      pool.push({ left: a+b, right: a, result: b, op: 'subtract' })
  随机选 missingPos ∈ ['right', 'result']

示例题目:
  11 - □ = 5  → 答案: 6 (missingPos = 'right')
  11 - 6 = □  → 答案: 5 (missingPos = 'result')
```

#### 乘法正算 `mulForward`
```
生成逻辑:
  for a in [lo..hi]:
    for b in [lo..hi]:
      pool.push({ left: a, right: b, result: a*b, missingPos: 'result' })

示例: 7 × 8 = □  → 答案: 56
```

#### 乘法填空 `mulBlank`
```
生成逻辑: 同上，但 missingPos ∈ ['left', 'right']

示例: □ × 8 = 56  → 答案: 7
      7 × □ = 56  → 答案: 8
```

#### 乘法反推 `mulReverse`（选择题）
```
给出乘积，4个选项是不同的 "a × b" 表达式
示例:
  题目: 哪个乘法等于 56?
  选项: A) 7 × 8  B) 7 × 9  C) 6 × 8  D) 8 × 7
  答案: A
```

#### 整除 `divide`
```
生成逻辑:
  for a in [lo..hi]:
    for b in [lo..hi]:
      pool.push({ left: a*b, right: a, result: b, op: 'divide' })
  missingPos ∈ ['right', 'result']

示例: 56 ÷ □ = 8  → 答案: 7
      56 ÷ 7 = □  → 答案: 8
```

### A.3 有余数除法（双输入）

#### divRem
```
生成逻辑:
  for b in [lo..hi]:      // 除数
    for q in [lo..hi]:     // 商
      for r in [1..b-1]:   // 余数 (1 ≤ r < b)
        a = b * q + r      // 被除数
        答案 = { q, r }    // 需要同时填写商和余数

示例: 23 ÷ 5 = □ ... □
      答案: 商=4, 余数=3  (因为 5×4+3=23)

UI展示: 两个输入框，左边填商，右边填余数
```

#### divReverse（余数反推）
```
生成逻辑:
  已知: 除数b, 商q
  算出: dividend = b*q + (b-1), remainder = b-1
  需填: 被除数 和 余数

示例: □ ÷ 5 = 4 ... □
      答案: 被除数=24, 余数=4  (因为 5×4+4=24)
```

### A.4 两位数加减法

#### addTwo
```
生成逻辑:
  scale = lo<=3 ? 10 : lo<=5 ? 20 : 30
  随机生成 a, b ∈ [scale, 99]
  结果 = a + b

示例: 47 + 36 = □  → 答案: 83
```

#### subtractTwo
```
生成逻辑:
  随机生成 b ∈ [scale, 50], diff ∈ [1, b-1]
  a = b + diff  (保证 a > b)

示例: 83 - 47 = □  → 答案: 36
```

### A.5 乘法比较 `compare`（选择题）
```
生成: 随机取 a1×b1 和 a2×b2
题目: a1×b1  ___  a2×b2
选项: ['>',  '<',  '=']
答案: 比较两个乘积大小

示例: 7×8 ___ 6×9
      56 > 54 → 答案: >
```

### A.6 应用题 `wordProblem`（完整模板库）

> 应用题共 **30+ 个模板**，分为以下类别。每个模板包含：
> - `tpl(a,b)`: 题干生成函数
> - `fn(a,b)`: 答案计算函数
> - `constraint(a,b)`: 数值约束条件（可选）
> - `genRange(lo,hi)`: 自定义数值生成（可选）

#### 类别一：基础加法（4个模板）
```
模板1: "小明有 {a} 颗糖，又得到了 {b} 颗，现在共有 ___ 颗糖"
答案: a + b
示例: 小明有 5 颗糖，又得到了 3 颗，现在共有 ___ 颗糖 → 8

模板2: "停车场有 {a} 辆车，又开来了 {b} 辆，现在共有 ___ 辆车"
答案: a + b

模板3: "哥哥有 {a} 张贴纸，妹妹有 {b} 张贴纸，他们一共有 ___ 张"
答案: a + b

模板4: "上午卖了 {a} 个面包，下午卖了 {b} 个，一天共卖了 ___ 个"
答案: a + b
```

#### 类别二：基础减法（4个模板）
```
模板1: "树上有 {a} 只鸟，飞走了 {b} 只，还剩 ___ 只"
答案: a - b    约束: a > b

模板2: "一本书 {a} 页，已经看了 {b} 页，还剩 ___ 页"
答案: a - b    约束: a > b

模板3: "超市有 {a} 个苹果，卖掉了 {b} 个，还剩 ___ 个"
答案: a - b    约束: a > b

模板4: "小红有 {a} 元钱，买文具花了 {b} 元，还剩 ___ 元"
答案: a - b    约束: a > b
```

#### 类别三：基础乘法（4个模板）
```
模板1: "每排坐 {a} 人，{b} 排一共坐 ___ 人"      → a × b
模板2: "每盒有 {a} 块饼干，买了 {b} 盒，一共有 ___ 块" → a × b
模板3: "一辆车有 4 个轮子，{b} 辆车一共有 ___ 个轮子"  → 4 × b (a固定为4)
模板4: "每束花 {a} 朵，买了 {b} 束，一共有 ___ 朵花"  → a × b
```

#### 类别四：基础除法（3个模板，整除）
```
模板1: "{a×b} 个苹果平均分给 {b} 人，每人分到 ___ 个" → a
模板2: "{a×b} 支铅笔，每 {b} 支装一盒，能装 ___ 盒"   → a
模板3: "有 {a×b} 块糖，平均分给 {a} 个小朋友，每人分 ___ 块" → b
```

#### 类别五：购买与找零（3个模板）
```
模板1: "一本笔记本 {a} 元，小明带了 {a+b} 元，最多能买 ___ 本"
答案: Math.floor((a+b)/a)    约束: a ≥ 3

模板2: "每把团扇 {a} 元，{b×a + a/2取整} 元最多能买 ___ 把"
答案: b    约束: a ≥ 3

模板3: "小红有 50 元，买了 {b} 个面包，每个 {a} 元，还剩 ___ 元"
答案: 50 - a×b    约束: a×b < 50, a ≥ 3
```

#### 类别六：除法余数实际场景（3个模板）
```
模板1: "{a} 位同学练武术，每排站 {b} 位，能站满 ___ 排"
答案: Math.floor(a/b)
约束: b≥3, a>b, a%b≠0
自定义生成: b随机, q=2~8, r=1~(b-1), a=b*q+r

模板2: "{a} 个鸡蛋，每 {b} 个装一盒，能装满 ___ 盒"
答案: Math.floor(a/b)

模板3: "{a} 个小朋友去划船，每条船坐 {b} 人，至少需要 ___ 条船"
答案: Math.ceil(a/b)   ← 注意是"至少"，需要向上取整!
```

#### 类别七：比较与倍数（3个模板）
```
模板1: "爸爸每分钟写 {a} 个字，妈妈写 {b} 个字，谁快？（输入较大数）"
答案: Math.max(a, b)

模板2: "小明跳了 {a} 下，小红跳的次数是小明的 {b} 倍，小红跳了 ___ 下"
答案: a × b    约束: b ∈ [2,5]

模板3: "姐姐有 {a×b} 颗珠子，是妹妹的 {b} 倍，妹妹有 ___ 颗"
答案: a    约束: b ∈ [2,5]
```

#### 类别八：多步运算（2个模板）
```
模板1: "商店有 {a} 个玩具，上午卖了 {b} 个，下午又进了 {b/2} 个，现在有 ___ 个"
答案: a - b + floor(b/2)    约束: a>b, b≥4, b为偶数

模板2: "图书馆有 {a} 本书，借出 {b} 本后又归还了 {b/3} 本，现在有 ___ 本"
答案: a - b + floor(b/3)    约束: a>b, b≥6, b能被3整除
```

#### 类别九：表格数据类（2个模板）
```
模板1: "文具店有铅笔 {a} 支、橡皮 {b} 块、尺子 {c} 把，铅笔和橡皮一共 ___ 件"
答案: a + b   (c为干扰数据)

模板2: "每个大盒装 {a} 个球，每个小盒装 {b} 个球。3个大盒和2个小盒共装 ___ 个球"
答案: a×3 + b×2    约束: a > b, a ≥ 5
```

#### 类别十：其他题型
```
瓶颈约束: "做一个风车需要3根竹签，现有 {a×3+b} 根，最多做 ___ 个风车"
答案: a    约束: b ∈ [0,2]

时间类1: "小明 {a} 点出门，{a+b} 点到学校，路上用了 ___ 小时"
答案: b    约束: a∈[6,8], b∈[1,2]

时间类2: "一节课 40 分钟，下课休息 10 分钟，两节课加一次课间共 ___ 分钟"
答案: 40×2 + 10 = 90 (固定)

排列组合: "有 {a} 件上衣和 {b} 条裤子，共有 ___ 种搭配"
答案: a × b    约束: a,b ∈ [2,5]

钱币计算: "小红有 {a} 张5元和 {b} 张1元，一共有 ___ 元"
答案: a×5 + b

等量代换: "1个苹果和 {b} 个橘子一样重，{a} 个苹果等于 ___ 个橘子"
答案: a × b

间隔问题1: "一条路一边种了 {a} 棵树，每两棵之间 {b} 米，从第一棵到最后一棵共 ___ 米"
答案: (a-1) × b    ← 经典的"植树问题"

间隔问题2: "一根绳子剪 {a} 刀，能剪成 ___ 段"
答案: a + 1    ← 经典的"剪绳问题"
```

### A.7 找规律 `pattern`

```
两种规律类型:

等差数列: start, start+d, start+2d, ___
  示例: 3, 6, 9, ___  → 答案: 12 (公差d=3)

等比数列: start, start×r, start×r², ___
  示例: 2, 6, 18, ___  → 答案: 54 (公比r=3)
  约束: 第三项 ≤ 200
```

### A.8 题目加权选择算法

```
目的: 让没做过的题优先出现，减少重复

算法:
1. 从 AsyncStorage 加载历史频率 freq = { questionKey: count }
2. 计算: maxFreq = max(所有题目出现次数)
3. 每题权重 w = maxFreq + 1 - freq[题目key]
   → 做过次数少的权重大
4. 按权重随机选择（轮盘赌算法）
5. 选中后更新 freq 并异步保存

用于: 普通练习模式
不用于: 对战模式（使用 seededRng 保证双方题目一致）
```

### A.9 竞速模式专用生成器

```
generateSpeedAdd(count, diffRange):
  - 和数范围: diffRange=[2,5] → maxSum=50; [6,7] → 80; [8,9] → 100
  - 随机生成 a+b ≤ maxSum 的加法题
  - 只缺 result

generateSpeedSub(count, diffRange):
  - 保证 a > b（无负数结果）

generateSpeedDiv(count, range):
  - 全部为整除题，同基础 divide
```

---

## 附录B：语文知识点完整数据

> 语文模块的学习内容全部来自**二年级下册（2024修订版）**教材。以下为完整数据索引。

### B.1 课文背诵闯关数据（12关）

| 关卡 | 来源 | 内容类型 | 标题 |
|------|------|----------|------|
| 第1关 | 第1课 古诗二首 | 古诗 | 《咏柳》[唐] 贺知章、《村居》[清] 高鼎 |
| 第2关 | 语文园地一 | 古诗 | 《赋得古原草送别（节选）》[唐] 白居易 |
| 第3关 | 语文园地二 | 名言 | "予人玫瑰，手有余香" 等3句 |
| 第4关 | 识字2 | 课文 | 《传统节日》（全文） |
| 第5关 | 语文园地三 | 常识 | 十二生肖 |
| 第6关 | 语文园地四 | 名言 | "失信不立"（《左传》《管子》《韩非子》） |
| 第7关 | 语文园地五 | 经典诵读 | 《弟子规》（节选） |
| 第8关 | 第14课 古诗二首 | 古诗 | 《绝句》[唐] 杜甫、《晓出净慈寺送林子方》[宋] 杨万里 |
| 第9关 | 第15课 | 课文 | 《雷雨》（全文） |
| 第10关 | 语文园地六 | 常识 | 二十四节气歌 |
| 第11关 | 语文园地七 | 古诗 | 《悯农（其一）》[唐] 李绅 |
| 第12关 | 语文园地八 | 古诗 | 《江上渔者》[宋] 范仲淹 |

**背诵模式**（3种）:
1. **朗读模式**: 显示全文，TTS 朗读
2. **挖空模式**: 随机遮盖关键字，用户选择填入
3. **首字提示**: 只显示每句首字，用户回忆全文

### B.2 识字表数据（465个字，按课分组）

完整的识字表按课文分布如下（示例前5课）：

| 课文 | 课名 | 字数 | 字列表示例 |
|------|------|------|-----------|
| 第1课 | 古诗二首（咏柳/村居） | 11 | 咏(yǒng) 贺(hè) 妆(zhuāng) 丝(sī) 裁(cái) 剪(jiǎn) 莺(yīng) 拂(fú) 堤(dī) 醉(zuì) 趁(chèn) |
| 第2课 | 找春天 | 13 | 脱(tuō) 袄(ǎo) 遮(zhē) 掩(yǎn) 探(tàn) 眉(méi) ... |
| 第3课 | 开满鲜花的小路 | 15 | 裹(guǒ) 颈(jǐng) 寄(jì) 粒(lì) 破(pò) 漏(lòu) ... |
| 第4课 | 邓小平爷爷植树 | 23 | 邓(dèng) 坛(tán) 龄(líng) 格(gé) 致(zhì) 勃(bó) ... |
| 识字1 | 神州谣 | 15 | 州(zhōu) 谣(yáo) 华(huá) 涌(yǒng) 耸(sǒng) ... |
| 识字4 | 中国美食 | 26 | 拌(bàn) 菠(bō) 煎(jiān) 腐(fǔ) 茄(qié) 烤(kǎo) ... |
| ... | ... | ... | ... |

共覆盖 **25课 + 8个语文园地 + 4个识字课** 的全部生字。

### B.3 写字表数据（250个字，按课分组）

写字表与识字表区别：写字表的字要求**会认会写**。示例：

| 课文 | 字数 | 字列表 |
|------|------|--------|
| 第1课 | 8 | 诗(shī) 碧(bì) 妆(zhuāng) 绿(lǜ) 丝(sī) 剪(jiǎn) 童(tóng) 归(guī) |
| 第2课 | 8 | 冲(chōng) 寻(xún) 眉(méi) 吐(tǔ) 闻(wén) 柳(liǔ) 荡(dàng) 桃(táo) |
| 第6课 | 10 | 桌(zhuō) 尝(cháng) 买(mǎi) 具(jù) 甘(gān) 汁(zhī) 甜(tián) 菜(cài) 劳(láo) 应(yīng) |
| ... | ... | ... |

### B.4 词语表数据（240个词，按课分组）

示例（前5课）：

| 课文 | 词语数 | 词语列表 |
|------|--------|---------|
| 第2课 | 6 | 春天、寻找、眉毛、野花、柳枝、桃花 |
| 第3课 | 11 | 鲜花、先生、原来、大叔、太太、做客、正巧、惊奇、快活、美好、礼物 |
| 第4课 | 8 | 植树、碧空如洗、万里无云、格外、引人注目、休息、小心、笔直 |
| 第5课 | 5 | 雷锋、叔叔、昨天、温暖、爱心 |
| 第6课 | 14 | 好奇、也许、桌子、平时、难道、平常、农民、加工、农具、甜菜、工具、劳动、经过、应该 |

### B.5 汉字详情字典（_charDict）

每个写字表的字都有丰富的学习数据：

```
字典结构 = {
  emoji: "📜",                           // 关联表情
  words: [{ word: "古诗", highlight: 0 }, // 组词（highlight 标记该字位置）
          { word: "诗人", highlight: 0 }],
  meaning: "有韵律的文学作品",             // 释义
  scene: "📜🎤🌙✨",                      // 场景emoji串
  memory: "言字旁像小话筒，寺院的和尚最爱念诗", // 记忆口诀
  example: "我会朗读这首古诗。",            // 例句
  parts: ["讠", "寺"]                      // 偏旁部首拆解
}
```

该字典覆盖写字表全部250个字，实现时需作为**静态数据文件**导入。

### B.6 听写模式数据

写字表的每个字还有**听写专用数据**：

```
听写数据结构 = {
  "诗": { contextWord: "古诗", contextPhrase: "古诗的诗" },
  "碧": { contextWord: "碧绿", contextPhrase: "碧绿的碧" },
  ...
}
```

听写流程：
1. TTS 朗读 contextPhrase（如"古诗的诗"）
2. 显示 4 个选项（1正确 + 3干扰项）
3. 干扰项生成：优先选同音字，其次选形近字

#### 

---

## 附录C：微信小程序实现分析





#### 2. 汉字笔画动画
```
原方案: @jamsch/react-native-hanzi-writer (基于 canvas)
小程序方案:
  方案A: 使用 <canvas> 组件 + hanzi-writer-data JSON
         从 jsDelivr CDN 获取笔画数据（同原方案）
         手动实现 canvas 绘制动画
  方案B: 使用 web-view 嵌套 hanzi-writer 网页版
  推荐方案A，完全可控
```

#### 3. TTS 语音合成
```
原方案: expo-speech (系统 TTS)
小程序方案:
  方案A: wx.getRecordManager + 后端 TTS API (百度/讯飞)
  方案B: 微信同声传译插件 (plugin://WechatSI/TTS)
  方案C: 预录音频文件 + wx.createInnerAudioContext
  推荐方案B（免费，支持中英文，接入简单）
```

#### 4. 音效播放
```
原方案: expo-av (Audio)
小程序方案: wx.createInnerAudioContext()
  - 支持网络地址 (原 Mixkit URL 可直接使用)
  - 支持同时播放多个音频
  - 注意: 需在 app.json 中声明 requiredBackgroundModes
```

#### 5. 手势与动画
```
原方案: react-native-reanimated + react-native-gesture-handler
小程序方案:
  - wx.createAnimation() 基础动画
  - <animation> 组件 + keyframes
  - WXS (WeiXin Script) 响应式动画（高性能）
  - worklet 动画 (基础库 2.29+)
  注意: 小程序动画能力弱于 RN reanimated，复杂粒子效果需简化
```

#### 6. 导航架构
```
原方案: React Navigation (Stack + Tab)
小程序方案:
  - 底部 Tab: app.json 中 tabBar 配置（最多5个）
  - 页面栈: wx.navigateTo / wx.redirectTo / wx.navigateBack
  - 最大页面栈层数: 10 层
  注意: 小程序没有 Modal 路由，弹窗需用组件实现
```

#### 7. 对战模式
```
原方案: 同屏分屏 + 房间码（纯本地 seededRng）
小程序方案:
  同屏对战: 不变（单设备内完成）
  房间码对战: 需要后端/云开发
    推荐: 微信云开发 实时数据库 + 云函数
    - 创建房间 → 云数据库写入 roomCode + seed
    - 加入房间 → 查询 roomCode 获取 seed
    - 双方用相同 seed 生成题目（seededRng 逻辑不变）
    - 结果同步 → 实时数据库监听
```

#### 8. 其他注意点
```
- 剪贴板: wx.setClipboardData (PIN码复制等)
- 震动反馈: wx.vibrateShort / wx.vibrateLong
- 屏幕常亮: wx.setKeepScreenOn(true) (护眼休息时)
- 定时器: 用 setInterval / setTimeout (同JS，但注意页面生命周期清理)
- 持久化: wx.setStorageSync 上限 10MB (足够本应用)
- 分享: wx.onShareAppMessage / wx.onShareTimeline
```

### C.3 微信小程序可用组件对照

| 原 RN 组件 | 小程序组件 | 说明 |
|-----------|-----------|------|
| `<View>` | `<view>` | 基础容器 |
| `<Text>` | `<text>` | 文本显示 |
| `<ScrollView>` | `<scroll-view>` | 滚动容器 |
| `<FlatList>` | `<scroll-view>` + `wx:for` | 列表渲染 |
| `<TouchableOpacity>` | `<view>` + `bindtap` | 点击事件 |
| `<TextInput>` | `<input>` / `<textarea>` | 文本输入 |
| `<Image>` | `<image>` | 图片显示 |
| `<Modal>` | 自定义组件 + `wx:if` | 弹窗 |
| `<Animated.View>` | `<view>` + `animation` 属性 | 动画容器 |
| `<SafeAreaView>` | 不需要（小程序自动安全区） | — |
| `<canvas>` (Hanzi) | `<canvas>` | 画布 |
| `NumberPad` (自定义) | 自定义组件 | 数字键盘 |
| `<LinearGradient>` | CSS `linear-gradient` 或 `<canvas>` | 渐变 |
| `Swipeable` (手势) | `<movable-view>` 或 touch 事件 | 滑动 |
| `BottomTabNavigator` | `tabBar` (app.json) | 底部导航 |
| `StackNavigator` | `wx.navigateTo` 页面栈 | 页面跳转 |

### C.4 推荐 UI 框架选型

| UI 框架 | 推荐指数 | 特点 | 适合度 |
|--------|---------|------|--------|
| **Taro + NutUI** | ⭐⭐⭐⭐⭐ | Taro 支持 React 语法，NutUI 组件丰富（京东出品），TS 支持好，可复用现有 React 逻辑 | **最佳选择** |
| **uni-app + uView** | ⭐⭐⭐⭐ | Vue 语法，uView 组件齐全，社区大，文档好 | 适合 Vue 开发者 |
| **WeUI** | ⭐⭐⭐ | 微信官方 UI 库，风格与微信统一，但组件较基础 | 适合简单应用 |
| **Vant Weapp** | ⭐⭐⭐⭐ | 有赞出品，60+ 高质量组件，移动端体验好 | 适合原生小程序开发 |
| **TDesign 小程序** | ⭐⭐⭐⭐ | 腾讯出品，设计规范完善，组件质量高 | 适合企业级应用 |
| **原生 WXML + WXSS** | ⭐⭐⭐ | 无框架依赖，性能最优，但开发效率低 | 适合极致性能需求 |

#### 推荐方案：**Taro 3 + React + NutUI**

理由：
1. **React 语法**：原项目是 React Native，用 Taro + React 可以最大程度复用组件逻辑和状态管理代码
2. **NutUI 组件**：
   - `Button`, `Cell`, `Grid` → 首页布局
   - `Progress` → 进度条（XP/任务）
   - `Dialog`, `Popup` → 弹窗（PIN输入、确认框）
   - `Tabs`, `TabBar` → 导航
   - `NumberKeyboard` → 数字键盘（可直接替代 NumberPad）
   - `CountDown` → 倒计时（竞速挑战、休息提醒）
   - `Skeleton` → 加载骨架
   - `NoticeBar` → 通知提示
   - `Tag`, `Badge` → 成就标签
3. **TypeScript 支持**：便于维护复杂的题目生成逻辑
4. **跨端能力**：Taro 还能编译到 H5/支付宝小程序等，扩展性好

