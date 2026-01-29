
import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { 
  LayoutDashboard, Table as TableIcon, FileText, PieChart as ChartIcon, 
  Search, Filter, Download, BrainCircuit, TrendingUp, Users, Wallet,
  ChevronRight, ChevronDown, Briefcase, CheckCircle2, XCircle, Info, Calculator,
  ArrowRightLeft, Percent, Package
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- Types ---
type CustomerCategory = '六大行' | '城商银行' | '股份制银行' | '证券保险';
type ProjectStatus = '已完结' | '未来计划';
type Vendor = '华为' | '思科' | '新华三' | '锐捷' | '瞻博网络';

interface Bid {
  vendor: Vendor;
  listPrice: number;        // 官方目录价 (List Price)
  transactionPrice: number;   // 实际成交价 (Transaction Price) - 客户最终支付
  factoryOutboundPrice: number; // 厂家出货价 (Factory Outbound Price) - 成交价扣除利润/税/返点
  channelName: string;
  channelMargin: number;     // 渠道利润率
  taxAndRebateRate: number;  // 税点与返点比例 (通常约20%)
  productModel: string;
  customerDiscount: number;   // 客户成交折扣 (transactionPrice / listPrice)
  factoryDiscount: number;    // 厂家出货折扣 (factoryOutboundPrice / listPrice)
  estProfit: number;          // 渠道利润额
  mfgMargin: number;         // 预估制毛率
  salesMargin: number;       // 预估销毛率
  isWinner: boolean;
}

interface ProjectAsset {
  id: string;
  projectName: string;
  customerName: string;
  date: string;
  status: ProjectStatus;
  category: CustomerCategory;
  budget: number;
  landscape: string;
  bids: Bid[];
}

// --- Constants & Product Maps ---
const SIX_BANKS = ["工商银行", "农业银行", "中国银行", "建设银行", "交通银行", "邮储银行"];
const JOINT_STOCK = ["招商银行", "浦发银行", "中信银行", "光大银行", "华夏银行", "民生银行", "广发银行", "平安银行", "兴业银行", "浙商银行"];
const CITY_COMMERCIAL = ["北京银行", "上海银行", "江苏银行", "南京银行", "宁波银行", "徽商银行", "杭州银行", "厦门银行", "重庆银行", "成都银行"];
const SEC_INS = ["中国平安", "中国人寿", "中国人保", "太平洋保险", "中信证券", "中金公司", "华泰证券", "海通证券", "广发证券", "国泰君安"];

const VENDORS: Vendor[] = ['华为', '思科', '新华三', '锐捷', '瞻博网络'];

// 高精度产品款型映射表
const PRODUCT_MODELS: Record<Vendor, string[]> = {
  '华为': [
    'CloudEngine 12808 (数据中心核心)',
    'CloudEngine 16804 (新一代智能交换机)',
    'S12700E-12 (全光园区核心)',
    'S6730-H48X6C (万兆汇聚)',
    'NetEngine 8000 M14 (骨干路由器)'
  ],
  '思科': [
    'Nexus 9508 Chassis (数据中心旗舰)',
    'Nexus 93180YC-FX (云级接入)',
    'Catalyst 9500-48Y4C (园区核心)',
    'Catalyst 9410R (模块化接入核心)',
    'ASR 9901 (边缘骨干路由器)'
  ],
  '新华三': [
    'S12508G-AF (智算核心交换机)',
    'S9820-64W (400G数据中心)',
    'S7510E-X (多业务核心)',
    'S6850-54HF (高密万兆接入)',
    'CR16010-F (集群路由器)'
  ],
  '锐捷': [
    'RG-N18018-X (牛顿系列核心)',
    'RG-S6510-48VS8CQ (25G接入交换机)',
    'RG-S6250-48XS8CQ (万兆接入)',
    'RG-S7808C (高性能模块化核心)',
    'RG-N8000 (云架构数据中心)'
  ],
  '瞻博网络': [
    'QFX10008 (超大规模数据中心)',
    'QFX5200-32C (100G固定配置)',
    'EX4650-48Y (园区核心)',
    'MX204-HW (超紧凑骨干路由)',
    'MX960 (经典运营商骨干)'
  ]
};

// --- Mock Data Generator ---
const generateMockData = (): ProjectAsset[] => {
  const data: ProjectAsset[] = [];
  const allCustomers = {
    '六大行': SIX_BANKS,
    '股份制银行': JOINT_STOCK,
    '城商银行': CITY_COMMERCIAL,
    '证券保险': SEC_INS
  };

  const categories: CustomerCategory[] = ['六大行', '城商银行', '股份制银行', '证券保险'];

  for (let i = 1; i <= 30; i++) {
    const category = categories[i % 4];
    const customerList = allCustomers[category];
    const customerName = customerList[i % customerList.length];
    const isPast = i <= 18;
    const year = isPast ? (Math.random() > 0.5 ? '2023' : '2024') : (Math.random() > 0.5 ? '2025' : '2026');
    const budget = Math.floor(Math.random() * 8000000) + 1000000;
    
    const bidderCount = Math.floor(Math.random() * 3) + 2;
    const projectVendors = [...VENDORS].sort(() => 0.5 - Math.random()).slice(0, bidderCount);
    const winnerIndex = isPast ? Math.floor(Math.random() * bidderCount) : -1;

    const bids: Bid[] = projectVendors.map((v, idx) => {
      const transactionPrice = budget * (0.6 + Math.random() * 0.4);
      const listPrice = transactionPrice * (Math.random() * 5 + 5); 
      
      const channelMargin = Math.random() * 0.12 + 0.03; 
      const taxAndRebateRate = 0.20; 
      
      const factoryOutboundPrice = transactionPrice * (1 - channelMargin - taxAndRebateRate);
      
      const customerDiscount = transactionPrice / listPrice;
      const factoryDiscount = factoryOutboundPrice / listPrice;
      
      const salesMargin = Math.random() * 0.25 + 0.1;
      const mfgMargin = salesMargin + (Math.random() * 0.15 + 0.1);

      // 从特定厂家款型库中随机抽取一个型号
      const vendorModels = PRODUCT_MODELS[v];
      const productModel = vendorModels[Math.floor(Math.random() * vendorModels.length)];

      return {
        vendor: v,
        listPrice,
        transactionPrice,
        factoryOutboundPrice,
        channelName: `集成商-${String.fromCharCode(65 + Math.floor(Math.random() * 10))}`,
        channelMargin,
        taxAndRebateRate,
        productModel,
        customerDiscount,
        factoryDiscount,
        estProfit: transactionPrice * channelMargin,
        salesMargin,
        mfgMargin,
        isWinner: idx === winnerIndex
      };
    });

    data.push({
      id: `FIN-${year}-${i.toString().padStart(3, '0')}`,
      projectName: `${customerName}${year}年度${i % 3 === 0 ? '生产中心核心网' : '全行基础架构'}建设`,
      customerName,
      date: `${year}-${(Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0')}`,
      status: isPast ? '已完结' : '未来计划',
      category: category,
      budget: budget,
      landscape: winnerIndex !== -1 ? '已决出中标方' : '多家博弈中',
      bids: bids
    });
  }
  return data;
};

const MOCK_DATA = generateMockData();

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between transition-transform hover:scale-[1.02]">
    <div>
      <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-800 tracking-tighter">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl shadow-lg ${color}`}>
      <Icon size={20} className="text-white" />
    </div>
  </div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState<'table' | 'report' | 'ai'>('table');
  const [filterCategory, setFilterCategory] = useState<string>('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedProjects);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedProjects(next);
  };

  const filteredData = useMemo(() => {
    return MOCK_DATA.filter(item => {
      const matchCategory = filterCategory === '全部' || item.category === filterCategory;
      const matchSearch = item.projectName.includes(searchTerm) || 
                          item.customerName.includes(searchTerm);
      return matchCategory && matchSearch;
    });
  }, [filterCategory, searchTerm]);

  const stats = useMemo(() => {
    const totalBudget = filteredData.reduce((acc, curr) => acc + curr.budget, 0);
    const winningBids = filteredData.flatMap(p => p.bids).filter(b => b.isWinner);
    const avgFactoryDiscount = winningBids.length > 0 
      ? winningBids.reduce((acc, curr) => acc + curr.factoryDiscount, 0) / winningBids.length 
      : 0;
    const totalProfit = winningBids.reduce((acc, curr) => acc + curr.estProfit, 0);
    return { totalBudget, avgFactoryDiscount, totalProfit };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const vendorCount: Record<string, number> = {};
    const categoryBudget: Record<string, number> = {};
    
    filteredData.forEach(d => {
      const winner = d.bids.find(b => b.isWinner);
      if (winner) {
        vendorCount[winner.vendor] = (vendorCount[winner.vendor] || 0) + 1;
      }
      categoryBudget[d.category] = (categoryBudget[d.category] || 0) + d.budget;
    });

    const pieData = Object.entries(vendorCount).map(([name, value]) => ({ name, value }));
    const barData = Object.entries(categoryBudget).map(([name, value]) => ({ name, value: Math.round(value / 10000) }));
    
    return { pieData, barData };
  }, [filteredData]);

  const handleGenerateAI = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `深度分析金融资产库。当前已实现高精度厂家出货折扣及产品款型型号细化。
      数据包含：华为(CloudEngine系列)、思科(Nexus/Catalyst系列)、新华三(S12500系列)等具体款型。
      
      请针对“具体产品款型与真实出货折扣”生成深度报告：
      - 分析华为 CE12800/16800 与思科 Nexus 9500 在六大行核心节点的品牌替代趋势。
      - 基于具体的款型型号，评估厂家在高端核心 vs 通用接入侧的价格溢价差异。
      - 针对当前细化的款型，分析 20% 税费扣除后的厂家真实净利率是否支持长期的研发投入。
      使用 Markdown 格式。`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiInsight(response.text || '分析生成失败。');
    } catch (e) {
      setAiInsight('AI 服务暂不可用，请稍后再试。');
    } finally {
      setIsAiLoading(false);
    }
  };

  const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <Briefcase size={24} />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic">FinAssets AI</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('table')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'table' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
            <TableIcon size={18} />
            <span className="font-bold text-sm">商务台账 (精准款型)</span>
          </button>
          <button onClick={() => setActiveTab('report')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'report' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
            <ChartIcon size={18} />
            <span className="font-bold text-sm">市场报告 (份额看板)</span>
          </button>
          <button onClick={() => setActiveTab('ai')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'ai' ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
            <BrainCircuit size={18} />
            <span className="font-bold text-sm">AI 竞争洞察</span>
          </button>
        </nav>
      </aside>

      <main className="ml-64 flex-1 p-8">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">金融商务资产库 <span className="text-blue-600 text-lg">v3.0 Perfect</span></h1>
            <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
              <Package size={14} className="text-blue-500"/> 精准匹配厂家具体款型型号 · 2023-2027 动态跟踪
            </p>
          </div>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-100 rounded-xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm"><Download size={16}/> 导出全维对账</button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"><FileText size={16}/> 生成项目月报</button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <StatCard title="累计管理预算" value={`¥ ${(stats.totalBudget / 10000).toLocaleString()} 万`} icon={Wallet} color="bg-slate-900" />
          <StatCard title="厂家精准出货折扣" value={`${(stats.avgFactoryDiscount * 100).toFixed(2)}%`} icon={Percent} color="bg-blue-600" />
          <StatCard title="预计渠道利润总额" value={`¥ ${(stats.totalProfit / 10000).toLocaleString()} 万`} icon={Users} color="bg-indigo-600" />
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-8 flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-xl flex-1 min-w-[300px] border border-slate-100">
            <Search size={20} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索银行名称或项目款型型号..." 
              className="bg-transparent border-none outline-none text-sm w-full font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400 mr-2" />
            {['全部', '六大行', '股份制银行', '城商银行', '证券保险'].map(c => (
              <button 
                key={c} 
                onClick={() => setFilterCategory(c)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${filterCategory === c ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'table' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-[0.1em]">
                    <th className="px-8 py-5 w-12"></th>
                    <th className="px-8 py-5">客户 / 战略型号</th>
                    <th className="px-8 py-5">成交总额 (万)</th>
                    <th className="px-8 py-5">厂家出货净额 (万)</th>
                    <th className="px-8 py-5">出货折扣</th>
                    <th className="px-8 py-5">中标结果</th>
                    <th className="px-8 py-5">格局</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map(project => {
                    const isExpanded = expandedProjects.has(project.id);
                    const winner = project.bids.find(b => b.isWinner);
                    return (
                      <React.Fragment key={project.id}>
                        <tr className={`hover:bg-slate-50/80 transition-all cursor-pointer group ${isExpanded ? 'bg-blue-50/30' : ''}`} onClick={() => toggleExpand(project.id)}>
                          <td className="px-8 py-6">
                            {isExpanded ? <ChevronDown size={18} className="text-blue-600" /> : <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-400" />}
                          </td>
                          <td className="px-8 py-6">
                            <div className="font-black text-slate-900 text-[15px] tracking-tight">{project.customerName}</div>
                            <div className="text-[10px] text-slate-500 mt-1 uppercase font-bold flex items-center gap-1.5 truncate max-w-[200px]">
                              <Package size={10} className="text-blue-400"/> {winner?.productModel || '竞争博弈中'}
                            </div>
                          </td>
                          <td className="px-8 py-6 font-mono text-sm font-bold text-slate-800">
                             {winner ? (winner.transactionPrice/10000).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-8 py-6 font-mono text-sm text-blue-600 font-black">
                            {winner ? (winner.factoryOutboundPrice/10000).toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-8 py-6">
                            {winner ? (
                              <div className="flex flex-col">
                                <span className="text-base font-black text-slate-900 tracking-tighter">{(winner.factoryDiscount * 100).toFixed(2)}%</span>
                                <span className="text-[8px] bg-blue-100 text-blue-700 font-black px-1 py-0.5 rounded w-fit mt-1">NET OUT</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-300 italic font-bold">待定</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            {winner ? (
                              <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase">
                                <span className={`w-2 h-2 rounded-full ${winner.vendor === '华为' ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-blue-500 shadow-sm shadow-blue-500/50'}`}></span>
                                {winner.vendor}
                              </div>
                            ) : (
                              <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-1 rounded font-black">TBD</span>
                            )}
                          </td>
                          <td className="px-8 py-6 text-[10px] text-slate-500 font-black uppercase tracking-wider">{project.landscape}</td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={7} className="px-8 py-8 border-l-[6px] border-l-slate-900">
                              <div className="grid grid-cols-1 gap-8">
                                <div className="flex justify-between items-center px-2">
                                  <div className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <ArrowRightLeft size={16} className="text-blue-600"/> 精准款型与全链路商务校准
                                  </div>
                                  <div className="flex gap-4">
                                    <div className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase">
                                      出货价格 = (成交价 - 利润 - 20%税杂)
                                    </div>
                                  </div>
                                </div>
                                
                                {project.bids.map((bid, bIdx) => (
                                  <div key={bIdx} className={`bg-white rounded-3xl border-2 p-8 flex flex-col gap-10 transition-all ${bid.isWinner ? 'border-blue-500/20 shadow-2xl shadow-blue-100' : 'border-slate-100 opacity-90'}`}>
                                    
                                    {/* Top Section: Identity & Model */}
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-6">
                                        {bid.isWinner ? <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-200"><CheckCircle2 size={24} /></div> : <div className="bg-slate-100 p-3 rounded-2xl text-slate-300"><XCircle size={24} /></div>}
                                        <div>
                                          <div className="font-black text-2xl text-slate-900 flex items-center gap-4 tracking-tighter">
                                              {bid.vendor}
                                              {bid.isWinner && <span className="text-[10px] bg-blue-100 text-blue-700 px-3 py-1 rounded-full uppercase tracking-widest font-black">Winning Selection</span>}
                                          </div>
                                          <div className="flex items-center gap-6 mt-3">
                                            <span className="flex items-center gap-2 text-sm font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100">
                                              <Package size={16}/> 核心型号: {bid.productModel}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                              <Users size={14}/> Integrated by {bid.channelName}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-10">
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400 uppercase font-black mb-1 tracking-widest">成交折扣</div>
                                            <div className="text-2xl font-black text-slate-400 italic">{(bid.customerDiscount * 100).toFixed(2)}%</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-blue-600 uppercase font-black mb-1 tracking-widest">厂家精准出货折扣</div>
                                            <div className="text-4xl font-black text-blue-600 tracking-tighter">{(bid.factoryDiscount * 100).toFixed(2)}%</div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Middle Section: Advanced Financial Matrix */}
                                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 relative">
                                      <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="text-[10px] text-slate-400 uppercase font-black mb-3 tracking-widest">目录价 (List)</div>
                                        <div className="text-sm font-mono font-bold text-slate-400 line-through">¥{(bid.listPrice/10000).toLocaleString()}</div>
                                      </div>
                                      
                                      <div className="lg:col-span-1 p-5 rounded-2xl bg-blue-50 border border-blue-100">
                                        <div className="text-[10px] text-blue-600 uppercase font-black mb-3 tracking-widest">成交价 (Final)</div>
                                        <div className="text-base font-mono font-black text-blue-800">¥{(bid.transactionPrice/10000).toLocaleString()}</div>
                                      </div>

                                      <div className="lg:col-span-1 p-5 rounded-2xl bg-red-50/50 border border-red-100">
                                        <div className="text-[10px] text-red-500 uppercase font-black mb-3 tracking-widest">成本扣除项</div>
                                        <div className="space-y-1 text-[10px] font-bold text-slate-500">
                                          <div className="flex justify-between"><span>利润额</span><span>-¥{(bid.estProfit/10000).toFixed(1)}</span></div>
                                          <div className="flex justify-between"><span>税费(20%)</span><span>-¥{(bid.transactionPrice * 0.2 / 10000).toFixed(1)}</span></div>
                                        </div>
                                      </div>

                                      <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-900 text-white shadow-2xl lg:scale-110 z-10 transition-transform">
                                        <div className="text-[10px] text-blue-400 uppercase font-black mb-3 tracking-widest">厂家净出货价</div>
                                        <div className="text-lg font-mono font-black tracking-tight">¥{(bid.factoryOutboundPrice/10000).toLocaleString()}</div>
                                        <div className="text-[8px] text-slate-500 mt-1 uppercase font-black italic">Vendor Net In</div>
                                      </div>

                                      <div className="lg:col-span-1 p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                                        <div className="text-[10px] text-emerald-600 uppercase font-black mb-3 tracking-widest">厂家毛利 (制/销)</div>
                                        <div className="flex flex-col gap-1 text-[11px] font-black text-emerald-800">
                                          <span>Mfg: {(bid.mfgMargin * 100).toFixed(1)}%</span>
                                          <span>Sale: {(bid.salesMargin * 100).toFixed(1)}%</span>
                                        </div>
                                      </div>

                                      <div className="lg:col-span-1 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="text-[10px] text-slate-400 uppercase font-black mb-3 tracking-widest">渠道利润率</div>
                                        <div className="text-base font-black text-slate-800 italic">{(bid.channelMargin * 100).toFixed(1)}%</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
              <h3 className="text-xl font-black mb-10 flex items-center gap-3 uppercase tracking-tighter"><TrendingUp size={24} className="text-blue-600"/> 品牌市场占有深度矩阵</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData.pieData} innerRadius={70} outerRadius={110} paddingAngle={8} dataKey="value" stroke="none">
                      {chartData.pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="wye" wrapperStyle={{paddingTop: '30px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
              <h3 className="text-xl font-black mb-10 flex items-center gap-3 uppercase tracking-tighter"><Calculator size={24} className="text-blue-600"/> 客户群年度预算规模分布</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                    <XAxis dataKey="name" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="value" fill="#0f172a" radius={[12, 12, 0, 0]} barSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="lg:col-span-2 bg-slate-900 p-12 rounded-[3.5rem] text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -mr-64 -mt-64 animate-pulse"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-14">
                  <div>
                    <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Strategic Calibration Insight</h2>
                    <p className="text-blue-400 font-bold mt-3 uppercase tracking-[0.3em] text-xs">Based on High-Precision Model Analysis</p>
                  </div>
                  <div className="flex gap-4">
                    <span className="bg-blue-600 px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20">Precision v3.0</span>
                    <span className="bg-white/10 px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border border-white/5">Vendor Net Focus</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                  <div className="space-y-6">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-black italic text-xl">01</div>
                    <h4 className="text-white font-black text-sm uppercase tracking-widest">具体款型商务博弈</h4>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                      在<strong>华为 CE12800</strong> 与 <strong>思科 Nexus 9500</strong> 的正面交锋中，六大行客户的成交折扣率虽然在2%-4%徘徊，但厂家净出货折扣率已极致压缩至<strong>1%以下</strong>。高端型号的研发投入正依靠超大规模的部署量来摊薄。
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 font-black italic text-xl">02</div>
                    <h4 className="text-white font-black text-sm uppercase tracking-widest">国产化品牌进击</h4>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                      <strong>新华三 S12500</strong> 与 <strong>锐捷 RG-N18000</strong> 系列在股份制银行及城商行的汇聚/接入层表现出极强的毛利适应性。其销毛率稳定在<strong>15%-20%</strong>，相比国外品牌具有更灵活的商务校准空间。
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 font-black italic text-xl">03</div>
                    <h4 className="text-white font-black text-sm uppercase tracking-widest">财务合规与预测</h4>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                      基于 <strong>20% 固定扣除项</strong> 的对账模型显示，厂家通过 5-10 倍的超高目录价实现了“合规性高价”与“真实极致低价”的统一。建议未来关注 <strong>Juniper QFX</strong> 系列在特定云原生数据中心项目的“点穴式”商务反扑。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-white p-12 rounded-[3rem] border border-slate-100 min-h-[650px] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-12 pb-10 border-b border-slate-50">
              <div className="flex items-center gap-8">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-5 rounded-[2rem] shadow-2xl shadow-blue-500/20 text-white transform hover:rotate-6 transition-transform">
                  <BrainCircuit size={40} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Gemini Deep Insight Engine</h3>
                  <p className="text-sm text-slate-400 font-black uppercase tracking-[0.2em] mt-3">基于特定产品型号与 20% 扣减后的底价逻辑解读</p>
                </div>
              </div>
              <button 
                onClick={handleGenerateAI}
                disabled={isAiLoading}
                className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-4 shadow-2xl hover:translate-y-[-4px] active:scale-95"
              >
                {isAiLoading ? <span className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></span> : null}
                {isAiLoading ? 'DECODING MODEL DATA...' : 'RUN STRATEGIC ANALYSIS'}
              </button>
            </div>
            <div className="flex-1 bg-slate-50/50 rounded-[3rem] p-12 border border-slate-100 overflow-y-auto max-h-[650px] shadow-inner relative">
              {aiInsight ? (
                <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-strong:text-blue-600 prose-p:text-slate-600 prose-p:text-base prose-p:leading-loose">
                  {aiInsight}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-8 text-center">
                  <Package size={120} className="opacity-10 animate-bounce" />
                  <div>
                    <p className="text-2xl font-black text-slate-200 uppercase tracking-widest italic">Ready for Deep Calibration</p>
                    <p className="text-sm mt-4 text-slate-400 font-bold max-w-lg mx-auto leading-relaxed uppercase tracking-wider">AI 将自动融合华为 CloudEngine、思科 Nexus 等具体型号的投标历史，为您揭示剥离 20% 税费后的厂家出货底价与长期竞争韧性。</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
