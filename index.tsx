
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
  ArrowRightLeft, Percent, Package, Calendar, ListChecks, Database, Tag
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// --- 版本号 ---
const APP_VERSION = "v4.0.20240520-FINAL";

// --- Types ---
type CustomerCategory = '六大行' | '城商银行' | '股份制银行' | '证券保险';
type Vendor = '华为' | '思科' | '新华三' | '锐捷' | '瞻博网络';

interface ProductLineItem {
  model: string;
  quantity: number;
  priceRatio: number; // 该型号占本次投标总价的比例 (0-1)
}

interface Bid {
  vendor: Vendor;
  listPrice: number;        
  transactionPrice: number;   
  factoryOutboundPrice: number; 
  channelName: string;
  channelMargin: number;     
  taxAndRebateRate: number;  // 20%
  products: ProductLineItem[]; // 至少5个具体型号
  customerDiscount: number;   
  factoryDiscount: number;    
  estProfit: number;          
  mfgMargin: number;         
  salesMargin: number;       
  isWinner: boolean;
}

interface Project {
  id: string;
  projectName: string;
  date: string; // 招投标时间
  budget: number;
  landscape: string;
  bids: Bid[];
}

interface CustomerGroup {
  customerName: string;
  category: CustomerCategory;
  projects: Project[];
}

// --- Constants & Detailed Product Pool ---
const SIX_BANKS = ["工商银行", "农业银行", "中国银行", "建设银行", "交通银行", "邮储银行"];
const JOINT_STOCK = ["招商银行", "浦发银行", "中信银行", "光大银行", "华夏银行", "民生银行", "广发银行", "平安银行", "兴业银行", "浙商银行"];
const CITY_COMMERCIAL = ["北京银行", "上海银行", "江苏银行", "南京银行", "宁波银行", "徽商银行", "杭州银行", "厦门银行", "重庆银行", "成都银行"];
const SEC_INS = ["中国平安", "中国人寿", "中国人保", "太平洋保险", "中信证券", "中金公司", "华泰证券", "海通证券", "广发证券", "国泰君安"];

const VENDOR_CATALOG: Record<Vendor, string[]> = {
  '华为': ['CloudEngine 12808-H', 'CloudEngine 16804-S', 'CloudEngine 8850-64', 'S12700E-8', 'S6730-H48X6C', 'NE8000-M14', 'Dorado 8000V6', 'AirEngine 8760', 'USG6680E', 'NCE-Fabric'],
  '思科': ['Nexus 9508-R Chassis', 'Nexus 9336C-FX2', 'Nexus 93180YC-FX', 'Catalyst 9500-48Y', 'Catalyst 9410R', 'ASR 9901-X', 'Firepower 4125', 'DNA-Center-P', 'MDS 9710-V2', 'UCS B200 M6'],
  '新华三': ['S12508G-AF智算核心', 'S9820-64W 400G', 'S7510E-XS多业务', 'S6850-54HF万兆', 'CR16010-H集群路由', 'UniServer R4900 G5', 'SecPath F5060 FW', 'CloudOS 5.0平台', 'UIS 7.0 HCI', 'MSR 3610-X1路由'],
  '锐捷': ['RG-N18018-X牛顿', 'RG-S6510-48V 25G', 'RG-S6250-48X万兆', 'RG-S7808C-H核心', 'RG-N8000-E云架构', 'RG-EG3000G-V2网关', 'RG-AP880-I WiFi6', 'RG-IS2710工业级', 'RG-BDS-AI运维', 'RG-WALL 1600防火墙'],
  '瞻博网络': ['QFX10008-E大核心', 'QFX5220-32CD 100G', 'EX4650-48Y-M', 'MX204-HW-V2路由', 'MX960-PREM骨干', 'SRX4600-SY安全', 'Mist-AP43-BZ无线', 'PTX10001-36MR', 'ACX710-X接入', 'Contrail-SDN控制']
};

// --- Mock Data Generator (Nested Structure) ---
const generateMockData = (): CustomerGroup[] => {
  const groups: CustomerGroup[] = [];
  const categories: CustomerCategory[] = ['六大行', '股份制银行', '城商银行', '证券保险'];
  const allCustomers = { '六大行': SIX_BANKS, '股份制银行': JOINT_STOCK, '城商银行': CITY_COMMERCIAL, '证券保险': SEC_INS };

  categories.forEach(cat => {
    allCustomers[cat].forEach(name => {
      const projectCount = Math.floor(Math.random() * 2) + 1; 
      const projects: Project[] = [];

      for (let p = 1; p <= projectCount; p++) {
        const year = 2023 + Math.floor(Math.random() * 3);
        const month = (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
        const budget = Math.floor(Math.random() * 8000000) + 3000000;
        
        const vendorsInProject = [...Object.keys(VENDOR_CATALOG) as Vendor[]].sort(() => 0.5 - Math.random()).slice(0, 3);
        const winnerIdx = Math.floor(Math.random() * vendorsInProject.length);

        const bids: Bid[] = vendorsInProject.map((v, vIdx) => {
          const transPrice = budget * (0.65 + Math.random() * 0.3);
          const listPrice = transPrice * (Math.random() * 4 + 7);
          const channelMargin = 0.04 + Math.random() * 0.09;
          const taxAndRebateRate = 0.20;
          const outPrice = transPrice * (1 - channelMargin - taxAndRebateRate);

          const pool = VENDOR_CATALOG[v];
          const selected = [...pool].sort(() => 0.5 - Math.random()).slice(0, 5); // 确保至少5个型号
          let remaining = 1.0;
          const products: ProductLineItem[] = selected.map((model, mIdx) => {
            const ratio = mIdx === 4 ? remaining : Math.max(0.05, Math.random() * (remaining / 1.5));
            remaining -= ratio;
            return {
              model,
              quantity: model.includes('核心') || model.includes('Chassis') || model.includes('集群') ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 50) + 10,
              priceRatio: ratio
            };
          });

          return {
            vendor: v,
            listPrice,
            transactionPrice: transPrice,
            factoryOutboundPrice: outPrice,
            channelName: `集成商-${String.fromCharCode(65 + Math.floor(Math.random() * 20))}`,
            channelMargin,
            taxAndRebateRate,
            products,
            customerDiscount: transPrice / listPrice,
            factoryDiscount: outPrice / listPrice,
            estProfit: transPrice * channelMargin,
            mfgMargin: 0.35 + Math.random() * 0.2,
            salesMargin: 0.15 + Math.random() * 0.15,
            isWinner: vIdx === winnerIdx
          };
        });

        projects.push({
          id: `PRJ-${year}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          projectName: `${name}${year}年度${p === 1 ? '数据中心网络集成' : '全行灾备系统扩容'}工程`,
          date: `${year}-${month}-${Math.floor(Math.random()*20+1).toString().padStart(2, '0')}`,
          budget,
          landscape: '中标定案',
          bids
        });
      }

      groups.push({ customerName: name, category: cat, projects });
    });
  });
  return groups;
};

const MOCK_DATA = generateMockData();

// --- Components ---
const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-start justify-between group hover:shadow-xl transition-all duration-500">
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic group-hover:text-blue-600 transition-colors">{value}</h3>
    </div>
    <div className={`p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
  </div>
);

const App = () => {
  const [activeTab, setActiveTab] = useState<'table' | 'report' | 'ai'>('table');
  const [filterCategory, setFilterCategory] = useState<string>('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const toggleCustomer = (name: string) => {
    const next = new Set(expandedCustomers);
    if (next.has(name)) next.delete(name); else next.add(name);
    setExpandedCustomers(next);
  };

  const toggleProject = (id: string) => {
    const next = new Set(expandedProjects);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedProjects(next);
  };

  const filteredData = useMemo(() => {
    return MOCK_DATA.filter(group => {
      const matchCat = filterCategory === '全部' || group.category === filterCategory;
      const matchSearch = group.customerName.includes(searchTerm) || 
                          group.projects.some(p => p.projectName.includes(searchTerm));
      return matchCat && matchSearch;
    });
  }, [filterCategory, searchTerm]);

  const stats = useMemo(() => {
    const allProjects = filteredData.flatMap(g => g.projects);
    const winners = allProjects.flatMap(p => p.bids).filter(b => b.isWinner);
    const totalBudget = allProjects.reduce((a, b) => a + b.budget, 0);
    const avgDisc = winners.length ? winners.reduce((a, b) => a + b.factoryDiscount, 0) / winners.length : 0;
    const profit = winners.reduce((a, b) => a + b.estProfit, 0);
    return { totalBudget, avgDisc, profit };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const vendorMap: Record<string, number> = {};
    const catMap: Record<string, number> = {};
    filteredData.forEach(g => {
      catMap[g.category] = (catMap[g.category] || 0) + g.projects.reduce((a, b) => a + b.budget, 0);
      g.projects.forEach(p => {
        const winner = p.bids.find(b => b.isWinner);
        if (winner) vendorMap[winner.vendor] = (vendorMap[winner.vendor] || 0) + 1;
      });
    });
    return {
      pieData: Object.entries(vendorMap).map(([name, value]) => ({ name, value })),
      barData: Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value/10000) }))
    };
  }, [filteredData]);

  const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const handleGenerateAI = async () => {
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `分析金融行业资产库 ${APP_VERSION}。
      当前数据已实现高精度嵌套：客户 -> 具体项目（含日期） -> 厂家投标（含BOM级明细）。
      每个厂家包含至少5个具体型号，提供台数与销售占比。
      商务对账逻辑：厂家底价 = 成交价 - 渠道利润 - 20%税杂费。
      请基于此多维数据生成深度分析，探讨主要厂商在大行与中小行核心BOM清单的配置策略演变。
      输出为 Markdown。`;
      const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setAiInsight(res.text || '');
    } catch { setAiInsight('AI 引擎暂时无法访问。'); }
    finally { setIsAiLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-blue-100">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-white flex flex-col fixed h-full z-40 shadow-2xl">
        <div className="p-10 border-b border-slate-800">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-blue-600 p-3 rounded-[1.2rem] shadow-xl rotate-3">
              <Database size={26} />
            </div>
            <span className="font-black text-2xl tracking-tighter uppercase italic">FinAssets</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag size={12} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{APP_VERSION}</span>
          </div>
        </div>
        <nav className="flex-1 p-8 space-y-4">
          <button onClick={() => setActiveTab('table')} className={`w-full flex items-center gap-5 px-6 py-5 rounded-3xl transition-all duration-300 ${activeTab === 'table' ? 'bg-blue-600 shadow-2xl shadow-blue-500/20 scale-105' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
            <TableIcon size={20} /> <span className="font-black text-sm uppercase tracking-wider">全维对账台账</span>
          </button>
          <button onClick={() => setActiveTab('report')} className={`w-full flex items-center gap-5 px-6 py-5 rounded-3xl transition-all duration-300 ${activeTab === 'report' ? 'bg-blue-600 shadow-2xl shadow-blue-500/20 scale-105' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
            <ChartIcon size={20} /> <span className="font-black text-sm uppercase tracking-wider">市场占有分析</span>
          </button>
          <button onClick={() => setActiveTab('ai')} className={`w-full flex items-center gap-5 px-6 py-5 rounded-3xl transition-all duration-300 ${activeTab === 'ai' ? 'bg-blue-600 shadow-2xl shadow-blue-500/20 scale-105' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}`}>
            <BrainCircuit size={20} /> <span className="font-black text-sm uppercase tracking-wider">AI 竞争洞察</span>
          </button>
        </nav>
        <div className="p-10 border-t border-slate-800">
          <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-500 tracking-tight">Active Engine</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-72 flex-1 p-12 max-w-[1700px] mx-auto">
        <header className="mb-14 flex justify-between items-end">
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              Financial Commercial <span className="text-blue-600">Assets</span>
            </h1>
            <p className="text-slate-500 font-bold flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Package size={16} className="text-blue-500" /> 
                <span className="text-blue-700 uppercase tracking-widest text-[11px] font-black">BOM-Level Precision</span>
              </div>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
              <span>20% Tax/Rebate Calibration</span>
              <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
              <span>Timeline: 2023-2027</span>
            </p>
          </div>
          <div className="flex gap-4 pb-2">
            <button className="px-8 py-4 bg-white border-2 border-slate-100 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 shadow-sm transition-all flex items-center gap-3">
              <Download size={18} /> 导出 BOM 台账
            </button>
            <button className="px-8 py-4 bg-slate-900 text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3">
              <FileText size={18} /> 厂商价格报告
            </button>
          </div>
        </header>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-14">
          <StatCard title="累计管理预算池" value={`¥ ${(stats.totalBudget/10000).toLocaleString()} 万`} icon={Wallet} color="bg-slate-900" />
          <StatCard title="厂家真实底价折扣" value={`${(stats.avgDisc*100).toFixed(2)}%`} icon={Percent} color="bg-blue-600" />
          <StatCard title="预估渠道让利规模" value={`¥ ${(stats.profit/10000).toLocaleString()} 万`} icon={Users} color="bg-indigo-600" />
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm mb-12 flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-4 bg-slate-50 px-6 py-4 rounded-3xl flex-1 border border-slate-100 transition-all focus-within:ring-2 focus-within:ring-blue-500/20">
            <Search size={22} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索客户名称、具体项目或是物料型号..." 
              className="bg-transparent border-none outline-none text-sm w-full font-bold placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <Filter size={20} className="text-slate-300 mr-2" />
            {['全部', '六大行', '股份制银行', '城商银行', '证券保险'].map(c => (
              <button 
                key={c} 
                onClick={() => setFilterCategory(c)} 
                className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${filterCategory === c ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        {activeTab === 'table' && (
          <div className="space-y-8 pb-20">
            {filteredData.map(group => {
              const isCustExpanded = expandedCustomers.has(group.customerName);
              return (
                <div key={group.customerName} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl">
                  {/* Layer 1: Customer */}
                  <div 
                    className={`px-12 py-10 flex items-center justify-between cursor-pointer group transition-colors ${isCustExpanded ? 'bg-slate-50/80 border-b border-slate-100' : 'hover:bg-slate-50'}`}
                    onClick={() => toggleCustomer(group.customerName)}
                  >
                    <div className="flex items-center gap-8">
                      <div className="p-5 bg-slate-900 text-white rounded-[1.8rem] shadow-2xl group-hover:rotate-6 transition-transform">
                        <Users size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-1">{group.customerName}</h2>
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-full uppercase tracking-widest">{group.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-14">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">年度活跃项目</p>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter italic">{group.projects.length} <span className="text-xs">UNIT</span></p>
                      </div>
                      {isCustExpanded ? <ChevronDown size={28} className="text-blue-600" /> : <ChevronRight size={28} className="text-slate-300" />}
                    </div>
                  </div>

                  {/* Layer 2: Projects */}
                  {isCustExpanded && (
                    <div className="p-10 space-y-8 bg-slate-50/30">
                      {group.projects.map(project => {
                        const isPrjExpanded = expandedProjects.has(project.id);
                        const winBid = project.bids.find(b => b.isWinner);
                        return (
                          <div key={project.id} className="bg-white rounded-[3rem] border border-slate-100 shadow-inner overflow-hidden hover:shadow-md transition-shadow">
                            <div 
                              className={`px-10 py-8 flex items-center justify-between cursor-pointer transition-colors ${isPrjExpanded ? 'bg-blue-50/30 border-b border-blue-50' : 'hover:bg-blue-50/10'}`}
                              onClick={() => toggleProject(project.id)}
                            >
                              <div className="flex items-center gap-6">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                                  <Calendar size={20} />
                                </div>
                                <div>
                                  <div className="font-black text-slate-900 text-lg tracking-tight">{project.projectName}</div>
                                  <div className="flex items-center gap-3 mt-1.5">
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">日期: {project.date}</span>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                    <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">ID: {project.id}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-12">
                                <div className="text-right">
                                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">成交底价折扣</p>
                                  <p className="text-lg font-black text-blue-600 italic">
                                    {winBid ? `${(winBid.factoryDiscount*100).toFixed(2)}%` : '待公示'}
                                  </p>
                                </div>
                                {isPrjExpanded ? <ChevronDown size={22} className="text-blue-600" /> : <ChevronRight size={22} className="text-slate-300" />}
                              </div>
                            </div>

                            {/* Layer 3: Bid & BOM */}
                            {isPrjExpanded && (
                              <div className="p-10 space-y-12 bg-slate-50/10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex justify-between items-center px-6">
                                  <div className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4">
                                    <ListChecks size={22} className="text-blue-600"/> 投标厂家 BOM 清单与全链路财务溯源
                                  </div>
                                  <div className="flex gap-4">
                                    <div className="bg-amber-100 text-amber-700 text-[10px] font-black px-5 py-2.5 rounded-2xl uppercase shadow-sm border border-amber-200">
                                      剥离项: 20% 税费返点 + 渠道利润
                                    </div>
                                  </div>
                                </div>

                                {project.bids.map((bid, bIdx) => (
                                  <div key={bIdx} className={`bg-white rounded-[3.5rem] border-2 p-10 flex flex-col gap-12 transition-all duration-500 ${bid.isWinner ? 'border-blue-500/30 shadow-2xl shadow-blue-100 scale-[1.01]' : 'border-slate-100 opacity-90'}`}>
                                    <div className="flex justify-between items-start px-2">
                                      <div className="flex items-start gap-8">
                                        <div className={`p-5 rounded-3xl text-white shadow-xl ${bid.isWinner ? 'bg-blue-600 shadow-blue-200' : 'bg-slate-100 text-slate-300'}`}>
                                          {bid.isWinner ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
                                        </div>
                                        <div>
                                          <div className="font-black text-3xl text-slate-900 tracking-tighter flex items-center gap-5">
                                            {bid.vendor}
                                            {bid.isWinner && (
                                              <span className="text-[10px] bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full uppercase font-black tracking-[0.2em] shadow-sm">
                                                Selected Partner
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-[11px] font-bold text-slate-400 mt-3 flex items-center gap-8">
                                            <span className="flex items-center gap-2"><Briefcase size={14}/> 集成商: {bid.channelName}</span>
                                            <span className="flex items-center gap-2"><Percent size={14}/> 渠道利润率: {(bid.channelMargin*100).toFixed(1)}%</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-16 text-right">
                                        <div>
                                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">成交总金额</p>
                                          <p className="text-3xl font-black text-slate-800 tracking-tighter italic">¥{(bid.transactionPrice/10000).toLocaleString()}万</p>
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-blue-600 uppercase font-black tracking-widest mb-2">厂家出货净额</p>
                                          <p className="text-5xl font-black text-blue-600 tracking-tighter italic">¥{(bid.factoryOutboundPrice/10000).toLocaleString()}万</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* BOM List Table */}
                                    <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 shadow-inner">
                                      <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                          <tr>
                                            <th className="px-10 py-6">产品具体型号 (BOM Model)</th>
                                            <th className="px-10 py-6">配置数量 (QTY)</th>
                                            <th className="px-10 py-6">销售金额占比 (Ratio)</th>
                                            <th className="px-10 py-6 text-right">分摊厂家底价 (万)</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                          {bid.products.map((p, pIdx) => (
                                            <tr key={pIdx} className="hover:bg-slate-50/50 transition-all duration-300">
                                              <td className="px-10 py-6 font-black text-slate-700 text-[15px] tracking-tight">
                                                <div className="flex items-center gap-4">
                                                  <Package size={18} className="text-blue-500/50" /> {p.model}
                                                </div>
                                              </td>
                                              <td className="px-10 py-6 font-mono font-bold text-slate-500 italic text-lg">{p.quantity} <span className="text-[10px] uppercase font-black tracking-widest ml-1 text-slate-300">Sets</span></td>
                                              <td className="px-10 py-6">
                                                <div className="flex items-center gap-6">
                                                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                                                    <div className="h-full bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]" style={{ width: `${p.priceRatio * 100}%` }}></div>
                                                  </div>
                                                  <span className="text-sm font-black text-slate-900 w-16 italic tracking-tighter">{(p.priceRatio * 100).toFixed(1)}%</span>
                                                </div>
                                              </td>
                                              <td className="px-10 py-6 text-right font-mono font-black text-blue-600 text-xl tracking-tighter">
                                                ¥{((bid.factoryOutboundPrice * p.priceRatio) / 10000).toFixed(2)}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* Financial KPI Row */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 bg-slate-900/5 p-10 rounded-[3rem] border border-slate-200/50">
                                      <div>
                                        <p className="text-[11px] text-slate-400 uppercase font-black mb-2 tracking-widest">官方目录总价</p>
                                        <p className="text-lg font-bold text-slate-400 line-through tracking-tighter italic">¥{(bid.listPrice/10000).toLocaleString()}万</p>
                                      </div>
                                      <div>
                                        <p className="text-[11px] text-blue-600 uppercase font-black mb-2 tracking-widest italic">底价对账折扣 (Net Out)</p>
                                        <p className="text-3xl font-black text-blue-600 italic tracking-tighter">{(bid.factoryDiscount*100).toFixed(2)}%</p>
                                      </div>
                                      <div>
                                        <p className="text-[11px] text-indigo-600 uppercase font-black mb-2 tracking-widest">渠道分让利润</p>
                                        <p className="text-2xl font-black text-indigo-700 italic tracking-tighter">¥{(bid.estProfit/10000).toFixed(1)}万</p>
                                      </div>
                                      <div>
                                        <p className="text-[11px] text-emerald-600 uppercase font-black mb-2 tracking-widest">预估毛利 (制/销)</p>
                                        <p className="text-base font-black text-emerald-800 italic">{(bid.mfgMargin*100).toFixed(1)}% / {(bid.salesMargin*100).toFixed(1)}%</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-20">
            <div className="bg-white p-14 rounded-[4rem] border border-slate-100 shadow-xl">
              <h3 className="text-2xl font-black mb-12 flex items-center gap-5 uppercase tracking-tighter italic"><TrendingUp size={32} className="text-blue-600"/> 品牌市场成交份额</h3>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData.pieData} innerRadius={100} outerRadius={160} paddingAngle={12} dataKey="value" stroke="none">
                      {chartData.pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="wye" wrapperStyle={{paddingTop: '60px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-14 rounded-[4rem] border border-slate-100 shadow-xl">
              <h3 className="text-2xl font-black mb-12 flex items-center gap-5 uppercase tracking-tighter italic"><Calculator size={32} className="text-blue-600"/> 板块预算聚合规模 (万)</h3>
              <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={12} fontWeight="900" axisLine={false} tickLine={false} />
                    <YAxis fontSize={12} fontWeight="900" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="value" fill="#0f172a" radius={[20, 20, 0, 0]} barSize={70} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* AI Tab */}
        {activeTab === 'ai' && (
          <div className="bg-white p-20 rounded-[5rem] border border-slate-100 min-h-[800px] flex flex-col shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[150px] -mr-96 -mt-96 animate-pulse"></div>
            <div className="flex items-center justify-between mb-20 pb-14 border-b border-slate-50 relative z-10">
              <div className="flex items-center gap-12">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[3rem] shadow-2xl text-white transform hover:rotate-12 transition-transform duration-500">
                  <BrainCircuit size={56} />
                </div>
                <div>
                  <h3 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Intelligence Calibration</h3>
                  <p className="text-lg text-slate-400 font-black uppercase tracking-[0.4em] mt-5">基于 BOM级对账与 20% 净额剥离逻辑的行业分析</p>
                </div>
              </div>
              <button onClick={handleGenerateAI} disabled={isAiLoading} className="px-14 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-6 shadow-2xl active:scale-95 group">
                {isAiLoading ? <span className="w-7 h-7 border-4 border-white/20 border-t-white rounded-full animate-spin"></span> : null}
                {isAiLoading ? 'Analysis Engine Running...' : 'Start Strategic Insight'}
              </button>
            </div>
            <div className="flex-1 bg-slate-50/50 rounded-[5rem] p-20 border border-slate-100 overflow-y-auto max-h-[800px] shadow-inner relative z-10">
              {aiInsight ? (
                <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-strong:text-blue-600 prose-p:text-slate-700 prose-p:text-lg prose-p:leading-loose">
                  {aiInsight}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-12 text-center">
                  <Database size={180} className="opacity-10 animate-pulse" />
                  <div>
                    <p className="text-4xl font-black text-slate-200 uppercase tracking-widest italic leading-tight">Ready for High-Dimension <br/> BOM Calibration</p>
                    <p className="text-lg mt-8 text-slate-400 font-bold max-w-3xl mx-auto leading-relaxed uppercase tracking-widest italic opacity-50">AI 将深度解读各行级客户、各项目时间窗口下的 BOM 构成差异，并复盘剥离 20% 税费后的真实利润护城河。</p>
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
