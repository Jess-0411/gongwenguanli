import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  BackpackIcon,
  BarChartIcon,
  BellIcon,
  CaretRightIcon,
  CheckCircledIcon,
  ChevronLeftIcon,
  ClockIcon,
  Cross2Icon,
  EyeOpenIcon,
  FileIcon,
  FileTextIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MixerHorizontalIcon,
  PaperPlaneIcon,
  Pencil2Icon,
  PersonIcon,
  PlusIcon,
  ReaderIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import {
  BottomSheet,
  Carousel,
  FlowStack,
  KeyboardInput,
  KeyboardTextarea,
  MobileScroll,
  useKeyboard,
  useKeyboardInsets,
  type FlowControls,
  type FlowScreen,
} from "./mobile";

type Role = "bureau" | "school";
type Section = "home" | "manage";
type ManageTab = "发文管理" | "收文管理" | "签报管理" | "局校协同发文管理" | "教育局来文";
type ReminderRecord = { count: number; lastTime: string };
type TodoType = "new-incoming" | "sign-reminder";
type TodoStatus = "待办" | "已办" | "逾期";

type DocumentTodo = {
  id: string;
  docId: string;
  type: TodoType;
  status: TodoStatus;
  createdAt: string;
  latestReminderAt?: string;
  reminderCount?: number;
};

type MessagePrdTab = "页面规则" | "字段字典" | "状态流程" | "后端规则";

type TodoFieldRule = {
  name: string;
  position: string;
  apiField: string;
  source: string;
  generation: string;
  emptyRule: string;
  clickAction: string;
};

type TodoStateRule = {
  from: string;
  event: string;
  to: string;
  prerequisite: string;
  conflictRule: string;
};

type TodoBackendRule = {
  name: string;
  producer: string;
  fields: string;
  uniqueKey: string;
  result: string;
  failureRule: string;
};

type MessagePrdSpec = {
  audience: string;
  scope: string;
  pageRules: Array<{ control: string; dataRule: string; action: string; failureRule: string }>;
  fieldRules: TodoFieldRule[];
  stateRules: TodoStateRule[];
  backendRules: TodoBackendRule[];
};

type CollabDoc = {
  id: string;
  title: string;
  no: string;
  type: string;
  author: string;
  secret: string;
  urgent: string;
  status: "草稿" | "已发布" | "已完成";
  created: string;
  dispatchTime: string;
  issuer: string;
  targetCount: number;
  signedCount: number;
  body: string;
  bodyFile?: string;
  attachment: string;
  reminders?: Record<string, ReminderRecord>;
};

const initialDocs: CollabDoc[] = [
  {
    id: "jx-001",
    title: "关于做好2026年秋季开学准备工作的通知",
    no: "新教办〔2026〕18号",
    type: "工作通知",
    author: "李老师",
    secret: "普通",
    urgent: "特急",
    status: "已发布",
    created: "2026-08-15 09:20",
    dispatchTime: "2026-08-15 10:00",
    issuer: "新乡市教育局",
    targetCount: 18,
    signedCount: 12,
    body: "各学校：为保障2026年秋季学期开学工作平稳有序，请对校园安全、教学设备、师资安排及后勤保障开展全面检查，并于8月20日前反馈落实情况。",
    attachment: "2026年秋季开学准备工作检查表.xlsx",
  },
  {
    id: "jx-002",
    title: "关于报送校园安全专项检查材料的通知",
    no: "新教安〔2026〕11号",
    type: "材料报送",
    author: "王老师",
    secret: "普通",
    urgent: "急件",
    status: "已完成",
    created: "2026-08-14 14:10",
    dispatchTime: "2026-08-14 15:00",
    issuer: "新乡市教育局",
    targetCount: 12,
    signedCount: 12,
    body: "请各学校按要求完成校园安全专项检查，并通过公文系统报送检查表及整改台账。",
    attachment: "校园安全专项检查材料清单.pdf",
  },
  {
    id: "jx-003",
    title: "全市中小学数字教育工作推进会会议通知",
    no: "新教科〔2026〕9号",
    type: "会议通知",
    author: "赵老师",
    secret: "普通",
    urgent: "平件",
    status: "草稿",
    created: "2026-08-13 11:35",
    dispatchTime: "-",
    issuer: "新乡市教育局",
    targetCount: 20,
    signedCount: 0,
    body: "拟于8月25日召开全市中小学数字教育工作推进会，请相关负责人参会。",
    attachment: "参会回执.docx",
  },
  {
    id: "jx-004",
    title: "关于开展秋季学期校园食品安全检查的通知",
    no: "新教体卫艺〔2026〕16号",
    type: "工作通知",
    author: "周老师",
    secret: "普通",
    urgent: "急件",
    status: "已发布",
    created: "2026-08-20 08:30",
    dispatchTime: "2026-08-20 09:00",
    issuer: "新乡市教育局",
    targetCount: 21,
    signedCount: 5,
    body: "各学校：请于秋季学期开学前完成校园食品安全自查，重点核查食堂环境、原料采购、从业人员健康管理及食品留样制度落实情况。",
    attachment: "校园食品安全检查要点.pdf",
  },
];

const initialMessages: DocumentTodo[] = [
  {
    id: "todo-jx-004-school-001-user-001",
    docId: "jx-004",
    type: "new-incoming",
    status: "待办",
    createdAt: "2026-08-20 09:00",
  },
  {
    id: "todo-jx-001-school-001-user-001",
    docId: "jx-001",
    type: "sign-reminder",
    status: "待办",
    createdAt: "2026-08-15 10:00",
    latestReminderAt: "2026-08-20 08:45",
    reminderCount: 2,
  },
];

const messagePrdSpec: MessagePrdSpec | null = {
  audience: "产品经理、交互设计师、前端研发、后端研发、测试及具备签收权限的学校业务评审人员。",
  scope: "仅说明学校端独立消息通知页及其教育局来文签收消息；PRD 入口只存在于评审原型，不进入正式产品。",
  pageRules: [
    { control: "返回", dataRule: "不读取或修改业务数据。", action: "关闭消息通知页并返回学校端首页，保留本次原型会话中的签收结果。", failureRule: "返回动画期间禁止重复触发。" },
    { control: "PRD", dataRule: "读取当前原型内置的 MessagePrdSpec 结构化规则。", action: "压入“消息通知 · PRD 规则”全屏说明层。", failureRule: "规则缺失时展示“当前页面规则未配置”，不得出现空白页。" },
    { control: "新来文消息卡片／查看详情", dataRule: "展示 notification_type=new_incoming 的消息及公文发布快照；内部 todo_status 不在页面展示。", action: "携带 document_id、school_id 直接进入独立教育局来文详情。", failureRule: "无权限、非接收学校或公文不存在时阻止进入并展示明确提示。" },
    { control: "催办消息卡片／查看详情", dataRule: "展示 notification_type=sign_reminder 的消息及最近有效催办聚合结果。", action: "进入独立公文详情；打开详情不改变内部处理状态，返回固定回消息通知页。", failureRule: "公文已签收时保留历史消息；已撤回时提示撤回。" },
    { control: "确认签收", dataRule: "提交 document_id、school_id、signer_id 和签收意见，由公文服务生成学校级回执。", action: "签收成功后将内部 todo_status 更新为已办，消息仍保留在时间流中。", failureRule: "重复签收返回既有回执；权限不足或公文撤回时不得生成新回执。" },
    { control: "空状态", dataRule: "当前用户可见消息查询结果为 0 时展示。", action: "只展示说明，不提供业务操作。", failureRule: "接口失败不得伪装为空状态，必须展示加载失败反馈。" },
  ],
  fieldRules: [
    { name: "卡片时间", position: "卡片上方居中", apiField: "updated_at", source: "待办服务", generation: "新来文取待办创建时间；催办取 latest_reminder_at；列表按该值倒序。", emptyRule: "服务端必填；缺失时显示“时间异常”并记录数据告警。", clickAction: "不可单独点击，随卡片整体进入详情。" },
    { name: "模块名称", position: "卡片头部", apiField: "notification_type", source: "待办服务", generation: "new_incoming 映射“公文签收”；sign_reminder 映射“签收催办”。", emptyRule: "未知枚举显示“公文消息”，同时上报枚举异常。", clickAction: "不可单独点击。" },
    { name: "图标", position: "卡片头部左侧", apiField: "notification_type", source: "移动端映射", generation: "new_incoming 使用绿色文件图标；sign_reminder 使用橙色提醒图标。", emptyRule: "未知枚举使用通用公文图标。", clickAction: "不可单独点击。" },
    { name: "内部处理状态", position: "隐藏兼容字段，消息页不展示", apiField: "todo_status", source: "待办服务", generation: "签收回执优先判定已办；未签收且超过截止时间为逾期；其余为待办。", emptyRule: "缺失时按异常待办处理并触发刷新，不影响消息时间流展示。", clickAction: "不提供页面筛选；仅用于详情签收能力和后端处理。" },
    { name: "主标题", position: "卡片正文首行", apiField: "notification_type", source: "移动端模板映射", generation: "new_incoming 映射“您有一份新的教育局来文待签收”；sign_reminder 映射“教育局提醒您尽快签收公文”。", emptyRule: "未知枚举显示“您有一条公文签收消息”。", clickAction: "随卡片整体进入独立详情。" },
    { name: "查看详情", position: "卡片底部右侧", apiField: "document_id、school_id", source: "公文服务／接收学校快照", generation: "所有可访问消息固定展示绿色文字和右箭头。", emptyRule: "任一跳转键缺失时隐藏入口并提示关联公文不存在。", clickAction: "压入 message-detail FlowScreen，返回固定回消息通知页。" },
    { name: "公文标题", position: "两类卡片正文", apiField: "document_title", source: "公文发布快照", generation: "公文正式发布时固化标题快照，待办只读展示。", emptyRule: "发布前服务端必填；异常缺失显示“未命名公文”并禁止静默丢弃待办。", clickAction: "随卡片进入 document_id 对应详情。" },
    { name: "发文单位", position: "新来文卡片正文", apiField: "issuer_name", source: "公文发布快照／组织服务", generation: "发布时按 issuer_id 固化单位名称，历史名称不随组织改名回写。", emptyRule: "显示“发文单位未提供”，详情接口继续按 issuer_id 查询。", clickAction: "不可单独点击。" },
    { name: "发布时间", position: "新来文卡片正文", apiField: "published_at", source: "公文服务", generation: "取公文正式发布成功的服务端时间，按 Asia/Shanghai 格式化。", emptyRule: "无发布时间的草稿不得生成待办。", clickAction: "不可单独点击。" },
    { name: "最近催办时间", position: "催办卡片正文", apiField: "latest_reminder_at", source: "催办服务／待办聚合", generation: "取同一 document_id、school_id 最近一次有效催办成功时间。", emptyRule: "催办类型下必填；缺失时回退待办 updated_at 并记录聚合异常。", clickAction: "不可单独点击。" },
    { name: "累计催办次数", position: "催办卡片正文", apiField: "reminder_count", source: "待办服务", generation: "同一公文、学校的有效催办事件累计；重复 event_id、无效催办和签收后催办不计数。", emptyRule: "按 0 处理但催办类型不得展示 0 次，需触发数据校正。", clickAction: "不可单独点击。" },
    { name: "待办ID", position: "隐藏业务字段", apiField: "todo_id", source: "待办服务", generation: "创建待办时生成不可变唯一 ID。", emptyRule: "缺失时该记录视为非法，不进入列表。", clickAction: "用于曝光、点击、处理结果埋点，不拼入用户可见 URL。" },
    { name: "公文ID", position: "隐藏跳转字段", apiField: "document_id", source: "公文服务", generation: "随发布、催办和签收事件透传，不允许前端自行生成。", emptyRule: "缺失时禁止点击并展示“关联公文不存在”。", clickAction: "作为教育局来文详情的主查询键。" },
    { name: "学校ID", position: "隐藏权限字段", apiField: "school_id", source: "接收学校快照", generation: "发布时从接收学校 ID 快照写入，学校改名不影响关联。", emptyRule: "缺失时不得创建待办。", clickAction: "与 document_id 共同执行详情和签收权限校验。" },
    { name: "用户ID", position: "隐藏收件人字段", apiField: "user_id", source: "统一用户与权限服务", generation: "发布或催办时按当前有效签收权限用户计算。", emptyRule: "缺失时不得创建用户待办并进入告警队列。", clickAction: "用于用户级待办查询与鉴权，不在界面展示。" },
    { name: "通知类型", position: "隐藏模板字段", apiField: "notification_type", source: "待办服务", generation: "首次发布为 new_incoming；发生有效催办后更新为 sign_reminder。", emptyRule: "使用通用消息模板兜底并上报异常。", clickAction: "决定卡片模板、图标、文案和埋点属性。" },
  ],
  stateRules: [
    { from: "未生成", event: "collab_document_published", to: "待办", prerequisite: "公文正式发布、学校在接收快照中、用户有效且具备查看与签收权限。", conflictRule: "相同业务唯一键已存在时幂等返回。" },
    { from: "待办／逾期", event: "collab_sign_reminded", to: "原状态", prerequisite: "公文未撤回且学校尚未签收。", conflictRule: "更新为催办模板并累计次数；重复 event_id 不累计。" },
    { from: "待办", event: "签收截止时间到达", to: "逾期", prerequisite: "本校不存在有效签收回执且公文未撤回。", conflictRule: "没有截止时间时不产生逾期状态。" },
    { from: "待办／逾期", event: "collab_school_signed", to: "已办", prerequisite: "公文服务已生成本校唯一有效签收回执。", conflictRule: "同校全部用户待办批量关闭；已办优先级最高。" },
    { from: "待办／逾期", event: "collab_document_withdrawn", to: "关闭", prerequisite: "教育局成功撤回公文。", conflictRule: "历史记录保留关闭原因，点击时提示公文已撤回。" },
    { from: "任意可见状态", event: "权限或所属学校失效", to: "隐藏", prerequisite: "账号停用、调离学校或失去查看／签收权限。", conflictRule: "仅改变可见性，不删除审计记录。" },
  ],
  backendRules: [
    { name: "公文发布事件", producer: "公文服务", fields: "event_id、document_id、bureau_id、school_ids、published_at", uniqueKey: "event_id；待办唯一键为 document_id+school_id+user_id", result: "按学校和签收权限用户创建 new_incoming 待办。", failureRule: "写入重试队列，不回滚公文发布。" },
    { name: "签收催办事件", producer: "催办服务", fields: "event_id、document_id、school_id、operator_id、reminded_at", uniqueKey: "event_id", result: "更新已有待办模板、latest_reminder_at 和 reminder_count；新增有权限但无待办的用户记录。", failureRule: "已签收学校拒绝更新；重复事件幂等返回。" },
    { name: "学校签收事件", producer: "公文服务", fields: "event_id、document_id、school_id、signer_id、signed_at", uniqueKey: "event_id；签收幂等键为 document_id+school_id", result: "将该校全部待办或逾期记录更新为已办。", failureRule: "关闭失败进入重试；不得回滚签收回执。" },
    { name: "公文撤回事件", producer: "公文服务", fields: "event_id、document_id、withdrawn_at", uniqueKey: "event_id", result: "关闭全部未完成待办并记录 withdrawn。", failureRule: "迟到事件不得覆盖已办状态，仅补充撤回审计。" },
    { name: "收件人计算", producer: "统一用户、组织与权限服务", fields: "school_id、user_id、account_status、permission_codes", uniqueKey: "school_id+user_id", result: "仅保留账号有效、所属学校匹配、同时具备查看和签收权限的用户。", failureRule: "查询失败不创建不完整待办，记录学校级告警并重试。" },
    { name: "【假设】消息列表查询契约", producer: "待办服务", fields: "biz_type、page、page_size；返回兼容待办字段及公文快照，不传 todo_status 筛选", uniqueKey: "todo_id", result: "按 updated_at 倒序返回当前用户全部可见公文签收消息。", failureRule: "接口地址由后端联调文档确定；失败时前端保留原消息列表。" },
    { name: "【假设】详情查询契约", producer: "公文服务", fields: "document_id、school_id", uniqueKey: "document_id+school_id", result: "鉴权通过后返回教育局来文稿纸、正文、附件和本校签收状态。", failureRule: "无权限、非接收学校、撤回或不存在时返回明确业务错误码。" },
    { name: "埋点与审计", producer: "移动端／待办服务", fields: "todo_id、notification_type、document_id、school_id、todo_status、reminder_count、result、error_code", uniqueKey: "trace_id+event_name", result: "记录列表曝光、卡片点击、详情结果、创建、催办、关闭和重试。", failureRule: "埋点失败不得阻断业务，规则层不得采集真实生产数据或正文。" },
  ],
};

const internalCards = [
  { title: "关于开展师德师风专题学习的通知", no: "F260815006", type: "内部通知", author: "张老师", status: "传阅中", time: "2026-08-15 09:32" },
  { title: "第二季度教育教学工作总结", no: "F260814012", type: "工作报告", author: "陈老师", status: "办结中", time: "2026-08-14 16:18" },
  { title: "校务会议纪要", no: "QB260813008", type: "会议纪要", author: "刘老师", status: "会签中", time: "2026-08-13 11:05" },
];

const schools = [
  ["新乡市第一中学", true, "王海燕", "2026-08-15 10:28"],
  ["新乡市第二中学", true, "赵强", "2026-08-15 10:42"],
  ["新乡市实验小学", false, "-", "-"],
  ["新乡市育才小学", true, "李敏", "2026-08-15 11:06"],
  ["新乡市外国语学校", false, "-", "-"],
  ["新乡市铁路高级中学", false, "-", "-"],
] as const;

function Header({ title, onBack, onRole, rightAction }: { title: string; onBack?: () => void; onRole?: () => void; rightAction?: ReactNode }) {
  return (
    <div className="app-header">
      <button className="icon-button" onClick={onBack} aria-label={onBack ? "返回" : "占位"} disabled={!onBack}>
        {onBack ? <ChevronLeftIcon /> : null}
      </button>
      <strong>{title}</strong>
      {rightAction ?? <button className="icon-button" onClick={onRole} aria-label={onRole ? "切换评审角色" : "占位"} disabled={!onRole}>
        {onRole ? <PersonIcon /> : null}
      </button>}
    </div>
  );
}

function BottomNav({ section, onChange }: { section: Section; onChange: (section: Section) => void }) {
  return (
    <nav className="bottom-nav" aria-label="主导航">
      <button className={section === "home" ? "active" : ""} onClick={() => onChange("home")}>
        <HomeIcon /><span>首页</span>
      </button>
      <button className={section === "manage" ? "active" : ""} onClick={() => onChange("manage")}>
        <BackpackIcon /><span>公文管理</span>
      </button>
    </nav>
  );
}

function TrendChart({ role }: { role: Role }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    const width = 345;
    const height = 190;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "#dfe3e7";
    ctx.lineWidth = 1;
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#7d8188";
    for (let i = 0; i < 5; i += 1) {
      const y = 16 + i * 36;
      ctx.beginPath(); ctx.moveTo(34, y); ctx.lineTo(334, y); ctx.stroke();
      ctx.fillText(String(20 - i * 5), 7, y + 4);
    }
    ["03", "04", "05", "06", "07", "08"].forEach((label, i) => ctx.fillText(label, 43 + i * 56, 181));
    const sets = role === "bureau"
      ? [[18, 3, 0, 1, 0, 1], [7, 2, 0, 1, 0, 0], [14, 2, 1, 3, 2, 2], [8, 6, 4, 5, 3, 4]]
      : [[16, 4, 1, 2, 1, 1], [6, 2, 0, 1, 0, 1], [12, 3, 1, 2, 2, 2], [10, 7, 3, 6, 5, 7]];
    ["#22bd8b", "#4f7ff0", "#f6a623", "#8b5cf6"].forEach((color, s) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      sets[s].forEach((value, i) => {
        const x = 52 + i * 56; const y = 160 - value * 7.2;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }, [role]);
  return <canvas ref={ref} className="trend-canvas" aria-label="公文数量趋势图" />;
}

function UrgencyChart() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; const ctx = canvas?.getContext("2d"); if (!canvas || !ctx) return;
    const ratio = window.devicePixelRatio || 1; canvas.width = 136 * ratio; canvas.height = 136 * ratio; canvas.style.width = "136px"; canvas.style.height = "136px"; ctx.scale(ratio, ratio);
    const values = [0.28, 0.2, 0.1, 0.42]; const colors = ["#2bc18f", "#4f7ff0", "#f7ad2b", "#ff8b4a"];
    let start = -Math.PI / 2;
    values.forEach((v, i) => { const end = start + Math.PI * 2 * v; ctx.beginPath(); ctx.moveTo(68, 68); ctx.arc(68, 68, 54, start, end); ctx.closePath(); ctx.fillStyle = colors[i]; ctx.fill(); ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.stroke(); start = end; });
    ctx.beginPath(); ctx.arc(68, 68, 24, 0, Math.PI * 2); ctx.fillStyle = "#fff"; ctx.fill(); ctx.fillStyle = "#34383d"; ctx.font = "600 16px sans-serif"; ctx.textAlign = "center"; ctx.fillText("119", 68, 65); ctx.font = "11px sans-serif"; ctx.fillStyle = "#8b9098"; ctx.fillText("公文", 68, 82);
  }, []);
  return <canvas ref={ref} aria-label="公文紧急程度占比图" />;
}

function HomePage({ role, docs, signedIds, onCreate, onOpenMessages }: { role: Role; docs: CollabDoc[]; signedIds: Set<string>; onCreate: () => void; onOpenMessages: () => void }) {
  const incomingCount = docs.filter((d) => d.status !== "草稿").length;
  const bureauQuick = [
    ["发文拟稿", <FileTextIcon />, "orange"],
    ["收文登记", <ReaderIcon />, "green"],
    ["签报拟稿", <Pencil2Icon />, "blue"],
    ["局校协同发文", <PaperPlaneIcon />, "purple"],
  ] as const;
  const schoolQuick = bureauQuick.slice(0, 3);
  const stats = role === "bureau"
    ? [["64", "发文总数", "orange"], ["35", "收文总数", "green"], ["20", "签报总数", "blue"], [String(incomingCount), "局校协同发文数", "purple"]]
    : [["52", "发文总数", "orange"], ["31", "收文总数", "green"], ["18", "签报总数", "blue"], [String(incomingCount), "教育局来文数", "purple"]];
  const quick = role === "bureau" ? bureauQuick : schoolQuick;
  return (
    <div className="home-page page-pad">
      <section className={`white-card quick-grid ${quick.length === 3 ? "cols-3" : ""} ${role === "school" ? "has-example-entry" : ""}`}>
        {role === "school" ? <button className="message-example-entry" onClick={onOpenMessages} aria-label="消息通知（示例）"><BellIcon />消息通知（示例）</button> : null}
        {quick.map(([label, icon, tone]) => (
          <button key={label} className="quick-item" onClick={label === "局校协同发文" ? onCreate : undefined}>
            <span className={`round-icon ${tone}`}>{icon}{label === "局校协同发文" ? <PlusIcon className="mini-plus" /> : null}</span>
            <span>{label}</span>
          </button>
        ))}
      </section>
      <section className="white-card stat-grid">
        {stats.map(([value, label, tone]) => (
          <div className="stat-item" key={label}>
            <span className={`round-icon compact ${tone}`}><BarChartIcon /></span>
            <div><strong>{label === "教育局来文数" ? String(Math.max(0, incomingCount - signedIds.size)) : value}</strong><span>{label}</span></div>
          </div>
        ))}
      </section>
      <section className="white-card chart-card">
        <div className="card-title-row"><h2>公文数量统计</h2></div>
        <div className="chart-legend">
          <span><i className="legend green" />发文</span><span><i className="legend blue" />收文</span><span><i className="legend orange" />签报</span><span><i className="legend purple" />{role === "bureau" ? "局校" : "来文"}</span>
        </div>
        <TrendChart role={role} />
      </section>
      <section className="white-card chart-card urgency-card">
        <h2>公文紧急程度占比</h2>
        <div className="urgency-content"><UrgencyChart /><div className="urgency-legend"><span><i className="dot green" />其他 28%</span><span><i className="dot blue" />急件 20%</span><span><i className="dot orange" />平件 10%</span><span><i className="dot coral" />特急 42%</span></div></div>
      </section>
    </div>
  );
}

function SearchBar({ value, onChange, onFilter }: { value: string; onChange: (v: string) => void; onFilter: () => void }) {
  return (
    <div className="search-row">
      <div className="search-box"><MagnifyingGlassIcon /><KeyboardInput value={value} onChange={(e) => onChange(e.target.value)} placeholder="请输入标题搜索" aria-label="标题搜索" /></div>
      <button className="filter-button" onClick={onFilter} aria-label="筛选"><MixerHorizontalIcon /></button>
    </div>
  );
}

function InternalList({ tab, query }: { tab: string; query: string }) {
  return <div className="doc-list">{internalCards.filter((x) => x.title.includes(query)).map((item) => <article className="doc-card" key={item.no}><span className="status-ribbon">{item.status}</span><h3>{item.title}</h3><p>发文字号：{item.no}</p><p>文件类型：{item.type}</p><p>拟稿人：{item.author}</p><p>创建时间：{item.time}</p><div className="card-actions"><button>查看</button></div></article>)}{query && !internalCards.some((x) => x.title.includes(query)) ? <Empty text={`暂无符合条件的${tab}`} /> : null}</div>;
}

function CollabList({ role, docs, signedIds, query, statusFilter, flow, onSign, onRemind }: { role: Role; docs: CollabDoc[]; signedIds: Set<string>; query: string; statusFilter: string; flow: FlowControls; onSign: (id: string) => void; onRemind: (docId: string, schoolNames: string[], time: string) => void }) {
  const keyboard = useKeyboard();
  const openFlow = (screen: FlowScreen) => { (document.activeElement as HTMLElement | null)?.blur(); keyboard.hide(); flow.push(screen); };
  const visible = docs.filter((doc) => role === "bureau" || doc.status !== "草稿").filter((doc) => doc.title.includes(query)).filter((doc) => {
    if (!statusFilter || statusFilter === "全部") return true;
    if (role === "bureau") return doc.status === statusFilter;
    const signed = signedIds.has(doc.id) || doc.id === "jx-002";
    return statusFilter === "已签收" ? signed : !signed;
  });
  if (!visible.length) return <Empty text="暂无符合条件的局校公文" />;
  return <div className="doc-list">{visible.map((doc) => {
    const signed = signedIds.has(doc.id) || doc.id === "jx-002";
    return <article className="doc-card collab-card" key={doc.id}>
      <span className={`status-ribbon ${doc.status === "草稿" ? "draft" : signed || doc.status === "已完成" ? "done" : ""}`}>{role === "school" ? (signed ? "已签收" : "待签收") : doc.status}</span>
      <h3>{doc.title}</h3><p>发文字号：{doc.no}</p><p>文件类型：{doc.type}</p>
      {role === "bureau" ? <><p>签收进度：{doc.signedCount}/{doc.targetCount} 所</p><p>创建时间：{doc.created}</p></> : <><p>发文单位：{doc.issuer}</p><p>发布时间：{doc.dispatchTime}</p></>}
      <div className="card-actions">
        <button onClick={() => openFlow(makeDetailScreen(doc, role, signed, onSign, onRemind))}>查看详情</button>
        {role === "bureau" && doc.status !== "草稿" ? <button onClick={() => openFlow(makeProgressScreen(doc, onRemind))}>签收进度</button> : null}
        {role === "bureau" && doc.signedCount > 0 ? <button onClick={() => openFlow(makeReceiptsScreen(doc))}>学校回执</button> : null}
        {role === "school" && signed ? <button onClick={() => openFlow(makeReceiptDetailScreen(doc, "新乡市第一中学", "王海燕", "2026-08-15 10:28"))}>签收记录</button> : null}
      </div>
    </article>;
  })}</div>;
}

function Empty({ text }: { text: string }) {
  return <div className="empty-state"><FileIcon /><strong>{text}</strong><span>请调整搜索或筛选条件后重试</span></div>;
}

function ManagePage({ role, docs, signedIds, flow, onSign, onRemind }: { role: Role; docs: CollabDoc[]; signedIds: Set<string>; flow: FlowControls; onSign: (id: string) => void; onRemind: (docId: string, schoolNames: string[], time: string) => void }) {
  const tabs: ManageTab[] = role === "bureau" ? ["发文管理", "收文管理", "签报管理", "局校协同发文管理"] : ["发文管理", "收文管理", "签报管理", "教育局来文"];
  const [tab, setTab] = useState<ManageTab>(tabs[0]);
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("全部");
  const isCollab = tab === "局校协同发文管理" || tab === "教育局来文";
  return <div className="manage-page">
    <div className="manage-tabs" role="tablist" aria-label="公文管理分类"><div className="manage-tabs-track">
      {tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => { setTab(item); setQuery(""); setStatusFilter("全部"); }} onPointerUp={() => { setTab(item); setQuery(""); setStatusFilter("全部"); }}>{item}</button>)}
    </div></div>
    <div className="manage-search"><SearchBar value={query} onChange={setQuery} onFilter={() => setFilterOpen(true)} />{statusFilter !== "全部" ? <button className="filter-chip" onClick={() => setStatusFilter("全部")}>{statusFilter}<Cross2Icon /></button> : null}</div>
    <MobileScroll className="manage-scroll"><main className="manage-content">{isCollab ? <CollabList role={role} docs={docs} signedIds={signedIds} query={query} statusFilter={statusFilter} flow={flow} onSign={onSign} onRemind={onRemind} /> : <InternalList tab={tab} query={query} />}</main></MobileScroll>
    <BottomSheet open={filterOpen} onOpenChange={setFilterOpen} title="筛选公文" description="筛选条件仅影响当前列表">
      <div className="sheet-options"><h4>{role === "bureau" && isCollab ? "发布状态" : isCollab ? "签收状态" : "办理状态"}</h4>{(role === "bureau" && isCollab ? ["全部", "草稿", "已发布", "已完成"] : ["全部", "待签收", "已签收"]).map((s) => <button className={statusFilter === s ? "selected" : ""} onClick={() => { setStatusFilter(s); setFilterOpen(false); }} key={s}>{s}<CheckCircledIcon /></button>)}<h4>发布时间</h4><div className="date-range"><button>2026-08-01</button><span>至</span><button>2026-08-15</button></div></div>
    </BottomSheet>
  </div>;
}

function RootHub({ flow }: { flow: FlowControls }) {
  const keyboard = useKeyboard();
  const [role, setRole] = useState<Role>(() => new URLSearchParams(window.location.search).get("role") === "school" ? "school" : "bureau");
  const [section, setSection] = useState<Section>("home");
  const [roleOpen, setRoleOpen] = useState(false);
  const [docs, setDocs] = useState(initialDocs);
  const [signedIds, setSignedIds] = useState<Set<string>>(new Set());
  const handleSign = (id: string) => setSignedIds((current) => new Set([...current, id]));
  const handleRemind = (docId: string, schoolNames: string[], time: string) => setDocs((current) => current.map((doc) => {
    if (doc.id !== docId) return doc;
    const reminders = { ...(doc.reminders ?? {}) };
    schoolNames.forEach((schoolName) => { const previous = reminders[schoolName]; reminders[schoolName] = { count: (previous?.count ?? 0) + 1, lastTime: time }; });
    return { ...doc, reminders };
  }));
  const handlePublished = (doc: CollabDoc) => { setDocs((current) => [doc, ...current]); setSection("manage"); };
  const changeSection = (nextSection: Section) => { (document.activeElement as HTMLElement | null)?.blur(); keyboard.hide(); setSection(nextSection); };
  const openTemplate = () => { (document.activeElement as HTMLElement | null)?.blur(); keyboard.hide(); flow.push(makeTemplateScreen(handlePublished)); };
  const openMessages = () => { (document.activeElement as HTMLElement | null)?.blur(); keyboard.hide(); flow.push(makeMessageScreen(docs, signedIds, handleSign, handleRemind)); };
  return <div className="root-shell">
    {section === "home" ? <Header title="公文管理" onRole={() => setRoleOpen(true)} /> : <div className="manage-role-bar"><button onClick={() => setRoleOpen(true)}><PersonIcon />{role === "bureau" ? "教育局端" : "学校端"}<CaretRightIcon /></button></div>}
    <div className="root-content">{section === "home" ? <MobileScroll className="root-scroll"><HomePage role={role} docs={docs} signedIds={signedIds} onCreate={openTemplate} onOpenMessages={openMessages} /></MobileScroll> : <ManagePage role={role} docs={docs} signedIds={signedIds} flow={flow} onSign={handleSign} onRemind={handleRemind} />}</div>
    <BottomNav section={section} onChange={changeSection} />
    <BottomSheet open={roleOpen} onOpenChange={setRoleOpen} title="切换评审角色" description="该入口仅用于原型评审，不属于正式产品功能">
      <div className="role-options"><button className={role === "bureau" ? "selected" : ""} onClick={() => { setRole("bureau"); setSection("home"); setRoleOpen(false); }}><span className="role-icon bureau"><BackpackIcon /></span><span><strong>教育局端</strong><small>创建局校发文、查看签收进度与回执</small></span><CheckCircledIcon /></button><button className={role === "school" ? "selected" : ""} onClick={() => { setRole("school"); setSection("home"); setRoleOpen(false); }}><span className="role-icon school"><HomeIcon /></span><span><strong>学校端</strong><small>查看教育局来文并完成签收</small></span><CheckCircledIcon /></button></div>
    </BottomSheet>
  </div>;
}

function ScreenHeader({ flow, title }: { flow: FlowControls; title: string }) { const keyboard = useKeyboard(); return <Header title={title} onBack={() => { (document.activeElement as HTMLElement | null)?.blur(); keyboard.hide(); flow.pop(); }} />; }

function MessageHeader({ flow }: { flow: FlowControls }) {
  const keyboard = useKeyboard();
  const close = () => { (document.activeElement as HTMLElement | null)?.blur(); keyboard.hide(); flow.pop(); };
  const openPrd = () => { (document.activeElement as HTMLElement | null)?.blur(); keyboard.hide(); flow.push(makeMessagePrdScreen()); };
  return <Header title="消息通知" onBack={close} rightAction={<button className="message-prd-entry" onClick={openPrd} aria-label="查看消息通知 PRD 规则">PRD</button>} />;
}

function makeMessageScreen(docs: CollabDoc[], signedIds: Set<string>, onSign: (id: string) => void, onRemind: (docId: string, schoolNames: string[], time: string) => void): FlowScreen {
  return { id: "message-notifications", headerHeight: 50, header: (flow) => <MessageHeader flow={flow} />, render: (flow) => <MessageNotificationsPage flow={flow} docs={docs} signedIds={signedIds} onSign={onSign} onRemind={onRemind} /> };
}

function MessageNotificationsPage({ flow, docs, signedIds, onSign, onRemind }: { flow: FlowControls; docs: CollabDoc[]; signedIds: Set<string>; onSign: (id: string) => void; onRemind: (docId: string, schoolNames: string[], time: string) => void }) {
  const [localSignedIds, setLocalSignedIds] = useState<Set<string>>(() => new Set(signedIds));
  const visibleMessages = [...initialMessages].sort((left, right) => {
    const leftUpdatedAt = left.latestReminderAt ?? left.createdAt;
    const rightUpdatedAt = right.latestReminderAt ?? right.createdAt;
    return rightUpdatedAt.localeCompare(leftUpdatedAt) || right.id.localeCompare(left.id);
  });
  const openMessage = (message: DocumentTodo) => {
    const doc = docs.find((item) => item.id === message.docId);
    if (!doc) return;
    const handleMessageSign = (id: string) => {
      onSign(id);
      setLocalSignedIds((current) => new Set([...current, id]));
    };
    flow.push(makeMessageDetailScreen(doc, localSignedIds.has(doc.id), handleMessageSign, onRemind));
  };
  return <div className="message-page">
    <MobileScroll className="message-scroll"><main className="message-content">
      {visibleMessages.length ? visibleMessages.map((message) => {
        const doc = docs.find((item) => item.id === message.docId);
        if (!doc) return null;
        const isReminder = message.type === "sign-reminder";
        return <section className="message-group" key={message.id}>
          <time>{isReminder ? message.latestReminderAt : message.createdAt}</time>
          <button className={`message-card ${isReminder ? "reminder" : "incoming"}`} onClick={() => openMessage(message)}>
            <span className="message-card-heading"><i>{isReminder ? <BellIcon /> : <FileTextIcon />}</i><strong>{isReminder ? "签收催办" : "公文签收"}</strong></span>
            <span className="message-divider" />
            <span className="message-card-title">{isReminder ? "教育局提醒您尽快签收公文" : "您有一份新的教育局来文待签收"}</span>
            <span className="message-meta"><b>公文标题：</b>{doc.title}</span>
            {isReminder ? <><span className="message-meta"><b>最近催办时间：</b>{message.latestReminderAt}</span><span className="message-meta"><b>累计催办次数：</b>{message.reminderCount} 次</span></> : <><span className="message-meta"><b>发文单位：</b>{doc.issuer}</span><span className="message-meta"><b>发布时间：</b>{doc.dispatchTime}</span></>}
            <span className="message-card-action">查看详情<CaretRightIcon /></span>
          </button>
        </section>;
      }) : <div className="message-empty"><BellIcon /><strong>暂无消息通知</strong><span>教育局发布或催办公文后，消息将在此展示</span></div>}
    </main></MobileScroll>
  </div>;
}

function makeMessagePrdScreen(): FlowScreen {
  return { id: "message-prd-rules", headerHeight: 50, header: (flow) => <ScreenHeader flow={flow} title="消息通知 · PRD 规则" />, render: () => <MessagePrdRulesPage /> };
}

function PrdDefinitionList({ rows }: { rows: Array<[string, string]> }) {
  return <dl className="prd-definition-list">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function MessagePrdRulesPage() {
  const [activeTab, setActiveTab] = useState<MessagePrdTab>("页面规则");
  const spec = messagePrdSpec;
  if (!spec) return <div className="prd-config-empty"><FileIcon /><strong>当前页面规则未配置</strong><span>请联系产品经理补充消息通知页规则。</span></div>;
  return <div className="todo-prd-page">
    <div className="todo-prd-tabs" role="tablist" aria-label="消息通知 PRD 规则分类">
      {(["页面规则", "字段字典", "状态流程", "后端规则"] as const).map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} onPointerUp={() => setActiveTab(tab)}>{tab}</button>)}
    </div>
    <MobileScroll className="todo-prd-scroll"><main className="todo-prd-content">
      {activeTab === "页面规则" ? <>
        <section className="prd-overview-card"><span>适用对象</span><p>{spec.audience}</p><span>适用范围</span><p>{spec.scope}</p></section>
        <h2 className="prd-section-title">控件与操作规则</h2>
        <div className="prd-rule-list">{spec.pageRules.map((rule) => <article className="prd-rule-card" key={rule.control}><header><strong>{rule.control}</strong><em>P0</em></header><PrdDefinitionList rows={[["数据规则", rule.dataRule], ["点击处理", rule.action], ["异常处理", rule.failureRule]]} /></article>)}</div>
      </> : null}
      {activeTab === "字段字典" ? <>
        <section className="prd-note-card"><strong>字段追溯规则</strong><p>每个页面字段必须能够追溯到接口字段、来源服务和生成规则；示例仅展示字段定义，不读取生产用户或学校数据。</p></section>
        <div className="prd-rule-list">{spec.fieldRules.map((rule) => <article className="prd-rule-card field" key={`${rule.apiField}-${rule.name}`}><header><strong>{rule.name}</strong><code>{rule.apiField}</code></header><PrdDefinitionList rows={[["页面位置", rule.position], ["来源服务", rule.source], ["生成／转换", rule.generation], ["空值／异常", rule.emptyRule], ["点击关联", rule.clickAction]]} /></article>)}</div>
      </> : null}
      {activeTab === "状态流程" ? <>
        <section className="prd-note-card"><strong>状态优先级</strong><p>有效签收回执对应“已办”，优先级高于逾期、催办和迟到事件；已办状态不得回退。</p></section>
        <div className="prd-state-list">{spec.stateRules.map((rule, index) => <article className="prd-state-card" key={`${rule.event}-${index}`}><div className="prd-state-route"><span>{rule.from}</span><i>→</i><strong>{rule.to}</strong></div><h3>{rule.event}</h3><PrdDefinitionList rows={[["前置条件", rule.prerequisite], ["冲突处理", rule.conflictRule]]} /></article>)}</div>
      </> : null}
      {activeTab === "后端规则" ? <>
        <section className="prd-note-card assumption"><strong>【假设】接口契约</strong><p>列表与详情的接口字段为研发联调建议，不固定 URL；最终地址和错误码以服务端接口文档为准。</p></section>
        <div className="prd-rule-list">{spec.backendRules.map((rule) => <article className="prd-rule-card backend" key={rule.name}><header><strong>{rule.name}</strong><span>{rule.producer}</span></header><PrdDefinitionList rows={[["关键字段", rule.fields], ["幂等／唯一键", rule.uniqueKey], ["处理结果", rule.result], ["失败处理", rule.failureRule]]} /></article>)}</div>
      </> : null}
    </main></MobileScroll>
  </div>;
}

function makeTemplateScreen(onPublished: (doc: CollabDoc) => void): FlowScreen {
  return { id: "template", headerHeight: 50, header: (flow) => <ScreenHeader flow={flow} title="选择协同模板" />, render: (flow) => <TemplateScreen flow={flow} onPublished={onPublished} /> };
}

function TemplateScreen({ flow, onPublished }: { flow: FlowControls; onPublished: (doc: CollabDoc) => void }) {
  const templates = [{ name: "市教育局标准发文稿纸", desc: "适用于工作通知、会议通知等局校协同公文" }, { name: "材料报送通知模板", desc: "适用于材料征集、数据报送等任务型公文" }];
  return <MobileScroll className="standalone-scroll"><main className="standalone-page template-page"><p className="page-hint">请选择一个已启用模板开始创建</p>{templates.map((t) => <button className="template-card" key={t.name} onClick={() => flow.push(makeComposeScreen(t.name, onPublished))}><span className="template-icon"><FileTextIcon /></span><span><strong>{t.name}</strong><small>{t.desc}</small></span><CaretRightIcon /></button>)}</main></MobileScroll>;
}

function makeComposeScreen(templateName: string, onPublished: (doc: CollabDoc) => void): FlowScreen {
  return { id: "compose", headerHeight: 50, header: (flow) => <ScreenHeader flow={flow} title="新增局校协同发文" />, render: (flow) => <ComposeScreen flow={flow} templateName={templateName} onPublished={onPublished} /> };
}

function ComposeScreen({ flow, templateName, onPublished }: { flow: FlowControls; templateName: string; onPublished: (doc: CollabDoc) => void }) {
  const keyboard = useKeyboard();
  const { bottomInset } = useKeyboardInsets();
  const steps = ["稿纸信息", "正文", "附件", "接收学校"];
  const [step, setStep] = useState(0); const [title, setTitle] = useState(""); const [no, setNo] = useState(""); const [type, setType] = useState("工作通知"); const [urgent, setUrgent] = useState("平件"); const [bodyFile, setBodyFile] = useState(""); const [attachment, setAttachment] = useState(""); const [selectedSchools, setSelectedSchools] = useState<string[]>(["新乡市第一中学", "新乡市第二中学"]); const [toast, setToast] = useState(""); const [published, setPublished] = useState(false);
  const valid = title.trim() && no.trim() && selectedSchools.length;
  const changeStep = (nextStep: number) => { (document.activeElement as HTMLElement | null)?.blur(); keyboard.hide(); setStep(nextStep); };
  const next = () => { if (step === 0 && (!title.trim() || !no.trim())) { setToast("请先填写公文标题和发文字号"); return; } setToast(""); changeStep(Math.min(3, step + 1)); };
  const publish = () => { if (!valid) { setToast(selectedSchools.length ? "请完整填写公文标题和发文字号" : "请至少选择一所接收学校"); return; } const doc: CollabDoc = { id: `jx-${Date.now()}`, title, no, type, author: "李老师", secret: "普通", urgent, status: "已发布", created: "2026-08-15 11:20", dispatchTime: "2026-08-15 11:20", issuer: "新乡市教育局", targetCount: selectedSchools.length, signedCount: 0, body: "", bodyFile, attachment: attachment || "暂无附件" }; onPublished(doc); setPublished(true); };
  if (published) return <div className="success-page"><CheckCircledIcon /><h2>发布成功</h2><p>公文已发送至 {selectedSchools.length} 所学校，签收进度将在局校协同发文管理中实时更新。</p><button className="primary-button" onClick={flow.pop}>完成</button></div>;
  return <div className="compose-layout"><Carousel ariaLabel="发文步骤" className="step-rail" contentClassName="step-track" draggingEnabled={false}>{steps.map((s, i) => <button className={i === step ? "active" : i < step ? "done" : ""} key={s} onClick={() => i <= step && changeStep(i)} onPointerUp={() => i <= step && changeStep(i)}><span>{i < step ? "✓" : i + 1}</span>{s}</button>)}</Carousel><MobileScroll className="compose-scroll"><main className="compose-content">
    {step === 0 ? <section className="form-card"><div className="template-note"><FileTextIcon /><span><small>当前模板</small><strong>{templateName}</strong></span></div><label>公文标题 <b>*</b><KeyboardInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入公文标题" /></label><label>发文字号 <b>*</b><KeyboardInput value={no} onChange={(e) => setNo(e.target.value)} placeholder="例：新教办〔2026〕18号" /></label><label>公文类型<select value={type} onChange={(e) => setType(e.target.value)}><option>工作通知</option><option>会议通知</option><option>材料报送</option></select></label><label>紧急程度<select value={urgent} onChange={(e) => setUrgent(e.target.value)}><option>平件</option><option>急件</option><option>特急</option></select></label></section> : null}
    {step === 1 ? <section className="form-card upload-card"><span className="upload-icon"><UploadIcon /></span><h3>上传正文（选填）</h3><p>支持 DOC、DOCX、PDF，单个文件不超过 20MB</p>{bodyFile ? <div className="file-row"><FileIcon /><span>{bodyFile}</span><button aria-label="删除正文" onClick={() => setBodyFile("")}><Cross2Icon /></button></div> : <button className="outline-button" onClick={() => setBodyFile("关于开展校园安全专项检查的通知正文.docx")}>选择正文文件</button>}<p className="field-help">正文不是必填项，未上传也可继续发文。</p></section> : null}
    {step === 2 ? <section className="form-card upload-card"><span className="upload-icon"><UploadIcon /></span><h3>上传附件</h3><p>支持 DOC、DOCX、PDF、XLSX，单个文件不超过 20MB</p>{attachment ? <div className="file-row"><FileIcon /><span>{attachment}</span><button onClick={() => setAttachment("")}><Cross2Icon /></button></div> : <button className="outline-button" onClick={() => setAttachment("秋季开学准备工作检查表.xlsx")}>选择演示附件</button>}</section> : null}
    {step === 3 ? <section className="form-card"><div className="section-title"><h3>接收学校</h3><span>已选 {selectedSchools.length} 所</span></div>{schools.slice(0, 5).map(([name]) => { const selected = selectedSchools.includes(name); return <button className={`school-select ${selected ? "selected" : ""}`} key={name} onClick={() => setSelectedSchools((current) => selected ? current.filter((x) => x !== name) : [...current, name])}><span><HomeIcon />{name}</span><CheckCircledIcon /></button>; })}</section> : null}
    {toast ? <div className="inline-error">{toast}</div> : null}
  </main></MobileScroll><div className="compose-actions" style={{ bottom: bottomInset }}><button onClick={() => { setToast("草稿已保存"); }}>保存草稿</button>{step > 0 ? <button onClick={() => changeStep(step - 1)}>上一步</button> : null}<button className="primary" onClick={step === 3 ? publish : next}>{step === 3 ? "发布" : "下一步"}</button></div></div>;
}

function makeMessageDetailScreen(doc: CollabDoc, signed: boolean, onSign: (id: string) => void, onRemind: (docId: string, schoolNames: string[], time: string) => void): FlowScreen {
  return { id: `message-detail-${doc.id}`, headerHeight: 50, header: (flow) => <ScreenHeader flow={flow} title="教育局来文详情" />, render: (flow) => <DetailPage flow={flow} doc={doc} role="school" initialSigned={signed} onSign={onSign} onRemind={onRemind} /> };
}

function makeDetailScreen(doc: CollabDoc, role: Role, signed: boolean, onSign: (id: string) => void, onRemind: (docId: string, schoolNames: string[], time: string) => void): FlowScreen {
  return { id: `detail-${doc.id}`, headerHeight: 50, header: (flow) => <ScreenHeader flow={flow} title={role === "bureau" ? "局校协同发文详情" : "教育局来文详情"} />, render: (flow) => <DetailPage flow={flow} doc={doc} role={role} initialSigned={signed} onSign={onSign} onRemind={onRemind} /> };
}

function DetailPage({ flow, doc, role, initialSigned, onSign, onRemind }: { flow: FlowControls; doc: CollabDoc; role: Role; initialSigned: boolean; onSign: (id: string) => void; onRemind: (docId: string, schoolNames: string[], time: string) => void }) {
  const keyboard = useKeyboard();
  const [tab, setTab] = useState("稿纸"); const [signOpen, setSignOpen] = useState(false); const [opinion, setOpinion] = useState(""); const [signed, setSigned] = useState(initialSigned || doc.id === "jx-002"); const [detailReminders, setDetailReminders] = useState<Record<string, ReminderRecord>>(doc.reminders ?? {});
  const doSign = () => { setSigned(true); onSign(doc.id); setSignOpen(false); };
  const openFlow = (screen: FlowScreen) => { (document.activeElement as HTMLElement | null)?.blur(); keyboard.hide(); flow.push(screen); };
  const handleDetailRemind = (docId: string, schoolNames: string[], time: string) => { setDetailReminders((current) => { const next = { ...current }; schoolNames.forEach((schoolName) => { const previous = next[schoolName]; next[schoolName] = { count: (previous?.count ?? 0) + 1, lastTime: time }; }); return next; }); onRemind(docId, schoolNames, time); };
  return <div className="detail-layout"><div className="detail-tabs">{["稿纸", "正文", "附件"].map((x) => <button className={tab === x ? "active" : ""} onClick={() => setTab(x)} key={x}>{x}</button>)}</div><MobileScroll className="detail-scroll"><main className="detail-content">
    {tab === "稿纸" ? <section className="paper-card"><span className="paper-template">市教育局标准发文稿纸</span><h2>局校协同发文稿纸</h2><dl><div><dt>公文标题</dt><dd>{doc.title}</dd></div><div><dt>发文字号</dt><dd>{doc.no}</dd></div><div><dt>文件类型</dt><dd>{doc.type}</dd></div><div><dt>拟稿人</dt><dd>{doc.author}</dd></div><div><dt>机密程度</dt><dd>{doc.secret}</dd></div><div><dt>紧急程度</dt><dd>{doc.urgent}</dd></div><div><dt>发文单位</dt><dd>{doc.issuer}</dd></div><div><dt>接收范围</dt><dd>{doc.targetCount} 所学校</dd></div></dl></section> : null}
    {tab === "正文" ? doc.bodyFile ? <section className="attachment-card"><FileIcon /><span><strong>{doc.bodyFile}</strong><small>正文文件 · 可预览</small></span><button><EyeOpenIcon />查看</button></section> : doc.body ? <article className="document-card"><h2>{doc.title}</h2><p className="document-no">{doc.no}</p><p>{doc.body}</p><div className="document-sign">新乡市教育局<br />2026年8月15日</div></article> : <section className="empty-state body-empty"><FileIcon /><strong>未上传正文</strong><span>该公文未上传正文文件</span></section> : null}
    {tab === "附件" ? <section className="attachment-card"><FileIcon /><span><strong>{doc.attachment}</strong><small>附件 · 可预览</small></span><button><EyeOpenIcon />查看</button></section> : null}
  </main></MobileScroll><div className="detail-actions">{role === "bureau" ? <><button onClick={() => openFlow(makeProgressScreen({ ...doc, reminders: detailReminders }, handleDetailRemind))}>签收进度</button><button className="primary" onClick={() => openFlow(makeReceiptsScreen(doc))}>学校回执</button></> : signed ? <button className="primary wide" onClick={() => openFlow(makeReceiptDetailScreen(doc, "新乡市第一中学", "王海燕", "2026-08-15 10:28", opinion))}>查看签收记录</button> : <button className="primary wide" onClick={() => setSignOpen(true)}>确认签收</button>}</div>
  <BottomSheet open={signOpen} onOpenChange={setSignOpen} title="确认签收" description="签收成功后教育局端将同步更新签收进度"><div className="sign-sheet"><div className="summary-row"><span>公文标题</span><strong>{doc.title}</strong></div><div className="summary-row"><span>当前签收人</span><strong>王海燕</strong></div><label>签收意见（选填）<KeyboardTextarea value={opinion} onChange={(e) => setOpinion(e.target.value.slice(0, 200))} placeholder="请输入签收意见" rows={4} /><small>{opinion.length} / 200</small></label><button className="primary-button" onClick={doSign}>确认签收</button></div></BottomSheet></div>;
}

function makeProgressScreen(doc: CollabDoc, onRemind: (docId: string, schoolNames: string[], time: string) => void): FlowScreen { return { id: `progress-${doc.id}`, headerHeight: 50, header: (flow) => <ScreenHeader flow={flow} title="签收进度" />, render: () => <ProgressPage doc={doc} onRemind={onRemind} /> }; }

function formatReminderTime() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function ProgressPage({ doc, onRemind }: { doc: CollabDoc; onRemind: (docId: string, schoolNames: string[], time: string) => void }) {
  const [filter, setFilter] = useState("全部");
  const [reminders, setReminders] = useState<Record<string, ReminderRecord>>(doc.reminders ?? {});
  const [confirmTarget, setConfirmTarget] = useState<"all" | string | null>(null);
  const [feedback, setFeedback] = useState("");
  const complete = doc.signedCount >= doc.targetCount;
  const schoolRows = schools.map(([name, signed, signer, signTime]) => ({ name, signed: complete || signed, signer, signTime }));
  const pendingRows = schoolRows.filter((school) => !school.signed);
  const pendingCount = Math.max(0, doc.targetCount - doc.signedCount);
  const visible = schoolRows.filter((school) => filter === "全部" || (filter === "已签收" ? school.signed : !school.signed));
  const remindCount = confirmTarget === "all" ? pendingCount : confirmTarget ? 1 : 0;
  const confirmReminder = () => {
    if (!confirmTarget || remindCount === 0) return;
    const targetNames = confirmTarget === "all" ? pendingRows.map((school) => school.name) : [confirmTarget];
    const time = formatReminderTime();
    setReminders((current) => {
      const next = { ...current };
      targetNames.forEach((schoolName) => { const previous = next[schoolName]; next[schoolName] = { count: (previous?.count ?? 0) + 1, lastTime: time }; });
      return next;
    });
    onRemind(doc.id, targetNames, time);
    setFeedback(confirmTarget === "all" ? `已向 ${pendingCount} 所学校发送催办` : `已向 ${confirmTarget} 发送催办`);
    setConfirmTarget(null);
  };
  return <><MobileScroll className="standalone-scroll"><main className="standalone-page progress-page">
    <section className="progress-summary"><div><strong>{doc.targetCount}</strong><span>接收学校</span></div><div><strong>{doc.signedCount}</strong><span>已签收</span></div><div><strong>{pendingCount}</strong><span>未签收</span></div></section>
    <button className="remind-all-button" disabled={pendingCount === 0} onClick={() => { setFeedback(""); setConfirmTarget("all"); }}><BellIcon /><span>{pendingCount === 0 ? "无需催办" : `一键催办全部未签收（${pendingCount}）`}</span></button>
    {feedback ? <div className="remind-feedback"><CheckCircledIcon />{feedback}</div> : null}
    <div className="segment-control">{["全部", "已签收", "未签收"].map((x) => <button className={filter === x ? "active" : ""} onClick={() => setFilter(x)} key={x}>{x}</button>)}</div>
    <div className="school-progress-list">{visible.map(({ name, signed, signer, signTime }) => { const reminder = reminders[name]; return <article key={name}><span className={`school-avatar ${signed ? "signed" : ""}`}><HomeIcon /></span><div className="school-progress-copy"><strong>{name}</strong><small>{signed ? (signer === "-" ? "已完成签收" : `${signer} · ${signTime}`) : "尚未签收"}</small>{!signed ? <small className="remind-meta">{reminder ? `已催办 ${reminder.count} 次 · ${reminder.lastTime}` : "尚未催办"}</small> : null}</div><div className="school-progress-actions"><span className={`state-pill ${signed ? "signed" : ""}`}>{signed ? "已签收" : "待签收"}</span>{!signed ? <button className="remind-one-button" onClick={() => { setFeedback(""); setConfirmTarget(name); }}>催办</button> : null}</div></article>; })}</div>
  </main></MobileScroll>
  <BottomSheet open={confirmTarget !== null} onOpenChange={(open) => { if (!open) setConfirmTarget(null); }} title={confirmTarget === "all" ? "一键催办" : "催办确认"} description="催办发送后将记录催办次数和时间">
    <div className="remind-sheet"><BellIcon /><strong>{confirmTarget === "all" ? `催办全部 ${pendingCount} 所未签收学校` : `催办 ${confirmTarget ?? ""}`}</strong><p>{confirmTarget === "all" ? "确认向当前公文的全部未签收学校发送催办吗？" : "确认提醒该学校尽快签收当前公文吗？"}</p><div className="remind-sheet-actions"><button className="secondary-button" onClick={() => setConfirmTarget(null)}>取消</button><button className="primary-button" onClick={confirmReminder}>确认催办</button></div></div>
  </BottomSheet></>;
}

function makeReceiptsScreen(doc: CollabDoc): FlowScreen { return { id: `receipts-${doc.id}`, headerHeight: 50, header: (flow) => <ScreenHeader flow={flow} title="学校回执" />, render: (flow) => <ReceiptsPage flow={flow} doc={doc} /> }; }
function ReceiptsPage({ flow, doc }: { flow: FlowControls; doc: CollabDoc }) { const keyboard = useKeyboard(); const signedSchools = schools.filter((x) => x[1]); const openReceipt = (screen: FlowScreen) => { (document.activeElement as HTMLElement | null)?.blur(); keyboard.hide(); flow.push(screen); }; return <MobileScroll className="standalone-scroll"><main className="standalone-page receipt-page"><div className="receipt-summary"><CheckCircledIcon /><span><strong>已收到 {doc.signedCount} 份回执</strong><small>共发送至 {doc.targetCount} 所学校</small></span></div>{signedSchools.map(([name, , signer, time]) => <button className="receipt-row" key={name} onClick={() => openReceipt(makeReceiptDetailScreen(doc, name, signer, time))}><span className="receipt-icon"><FileTextIcon /></span><span><strong>{name}</strong><small>{signer} · {time}</small></span><CaretRightIcon /></button>)}</main></MobileScroll>; }

function makeReceiptDetailScreen(doc: CollabDoc, school: string, signer: string, time: string, opinion = "已阅，已按要求安排落实。"): FlowScreen { return { id: `receipt-${doc.id}-${school}`, headerHeight: 50, header: (flow) => <ScreenHeader flow={flow} title="签收记录" />, render: () => <ReceiptDetail doc={doc} school={school} signer={signer} time={time} opinion={opinion} /> }; }
function ReceiptDetail({ doc, school, signer, time, opinion }: { doc: CollabDoc; school: string; signer: string; time: string; opinion: string }) { return <MobileScroll className="standalone-scroll"><main className="standalone-page receipt-detail"><div className="receipt-stamp"><CheckCircledIcon /><strong>已签收</strong></div><h2>局校协同公文签收回执</h2><dl><div><dt>公文标题</dt><dd>{doc.title}</dd></div><div><dt>发文字号</dt><dd>{doc.no}</dd></div><div><dt>发文单位</dt><dd>{doc.issuer}</dd></div><div><dt>签收学校</dt><dd>{school}</dd></div><div><dt>签收人</dt><dd>{signer}</dd></div><div><dt>签收时间</dt><dd>{time}</dd></div><div><dt>签收意见</dt><dd>{opinion || "无"}</dd></div></dl></main></MobileScroll>; }

export default function Prototype() {
  const initial = useMemo<FlowScreen>(() => ({ id: "root", render: (flow) => <RootHub flow={flow} /> }), []);
  return <FlowStack initial={initial} />;
}
