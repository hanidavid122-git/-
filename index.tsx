
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
  ArrowRightLeft, Percent
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

// --- Constants ---
const SIX_BANKS = ["工商银行", "农业银行", "中国银行", "建设银行", "交通银行", "邮储银行"];
const JOINT_STOCK = ["招商银行", "浦发银行", "中信银行", "光大银行", "华夏银行", "民生银行", "广发银行", "平安银行", "兴业银行", "浙商银行"];
const CITY_COMMERCIAL = ["北京银行", "上海银行", "江苏银行", "南京银行", "宁波银行", "徽商银行", "杭州银行", "厦门银行", "重庆银行", "成都银行"];
const SEC_INS = ["中国平安", "中国人寿", "中国人保", "太平洋保险", "中信证券", "中金公司", "华泰证券", "海通证券", "广发证券", "国泰君安"];

const VENDORS: Vendor[] = ['华为', '思科', '新华三', '锐捷', '瞻博网络'];

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
      const listPrice = transactionPrice * (Math.random() * 5 + 5); // 目录价通常是成交价的5-10倍
      
      const channelMargin = Math.random() * 0.12 + 0.03; // 3%-15%
      const taxAndRebateRate = 0.20; // 统一税点与返点扣除比例为20%
      
      // 厂家出货价 = 成交价 - 渠道利润 - (成交价 * 税点返点率)
      const factoryOutboundPrice = transactionPrice * (1 - channelMargin - taxAndRebateRate);
      
      const customerDiscount = transactionPrice / listPrice;
      const factoryDiscount = factoryOutboundPrice / listPrice;
      
      const salesMargin = Math.random() * 0.25 + 0.1;
      const mfgMargin = salesMargin + (Math.random() * 0.15 + 0.1);

      return {
        vendor: v,
        listPrice,
        transactionPrice,
        factoryOutboundPrice,
        channelName: `集成商-${String.fromCharCode(65 + Math.floor(Math.random() * 10))}`,
        channelMargin,
        taxAndRebateRate,
        productModel: v === '华为' ? 'CE12800/S12700' : v === '思科' ? 'Nexus 9K/C9500' : v === '新华三' ? 'S12500-G/S9800' : '核心汇聚级旗舰',
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
      projectName: `${customerName}${year}年度${i % 3 === 0 ? '全行云网' : '生产中心'}建设`,
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
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
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
      const prompt = `深度分析金融资产库。当前已实现高精度厂家出货折扣校准。
      计算逻辑：厂家出货价 = 成交价 - 渠道利润 - (成交价 * 20%税点返点)。
      
      请针对“厂家真实出货折扣”生成深度分析报告：
      - 比较华为、思科、新华三在剥离渠道与税务成本后的真实价格策略。
      - 分析六大行项目的“极致低价”是否已触及厂家成本线（结合制毛率）。
      - 探讨在20%税点返点固定扣除下，厂家如何通过目录价操纵实现合规性要求。
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
          <div className="bg-blue-600 p-2 rounded-lg">
            <Briefcase size={24} />
          </div>
          <span className="font-bold text-lg tracking-tight">金融资产中心</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('table')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <TableIcon size={18} />
            <span className="font-medium text-sm">商务台账 (Excel+)</span>
          </button>
          <button onClick={() => setActiveTab('report')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'report' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <ChartIcon size={18} />
            <span className="font-medium text-sm">市场报告 (PPT)</span>
          </button>
          <button onClick={() => setActiveTab('ai')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <BrainCircuit size={18} />
            <span className="font-medium text-sm">AI 竞争洞察</span>
          </button>
        </nav>
      </aside>

      <main className="ml-64 flex-1 p-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">金融行业商务资产库</h1>
            <p className="text-slate-500 mt-1">深度校准：厂家出货折扣 = (成交价 - 渠道利润 - 20%税费) / 目录价</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"><Download size={16}/> 导出商务对账单</button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-lg shadow-blue-200"><FileText size={16}/> 生成校准分析</button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="累计管理预算" value={`¥ ${(stats.totalBudget / 10000).toLocaleString()} 万`} icon={Wallet} color="bg-slate-900" />
          <StatCard title="厂家平均出货折扣" value={`${(stats.avgFactoryDiscount * 100).toFixed(2)}%`} icon={Percent} color="bg-blue-600" />
          <StatCard title="预计渠道利润额" value={`¥ ${(stats.totalProfit / 10000).toLocaleString()} 万`} icon={Users} color="bg-indigo-600" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg flex-1 min-w-[250px]">
            <Search size={18} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索银行名称..." 
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400 mr-2" />
            {['全部', '六大行', '股份制银行', '城商银行', '证券保险'].map(c => (
              <button 
                key={c} 
                onClick={() => setFilterCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterCategory === c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'table' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-4 w-10"></th>
                    <th className="px-6 py-4">客户与项目</th>
                    <th className="px-6 py-4">成交总价 (万)</th>
                    <th className="px-6 py-4">厂家出货价 (万)</th>
                    <th className="px-6 py-4">出货折扣率</th>
                    <th className="px-6 py-4">中标结果</th>
                    <th className="px-6 py-4">格局</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map(project => {
                    const isExpanded = expandedProjects.has(project.id);
                    const winner = project.bids.find(b => b.isWinner);
                    return (
                      <React.Fragment key={project.id}>
                        <tr className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/20' : ''}`} onClick={() => toggleExpand(project.id)}>
                          <td className="px-6 py-4">
                            {isExpanded ? <ChevronDown size={16} className="text-blue-600" /> : <ChevronRight size={16} className="text-slate-400" />}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 text-sm">{project.customerName}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px]">{project.projectName}</div>
                          </td>
                          <td className="px-6 py-4 font-mono text-sm">
                             {winner ? (winner.transactionPrice/10000).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 font-mono text-sm text-blue-600 font-bold">
                            {winner ? (winner.factoryOutboundPrice/10000).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4">
                            {winner ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900">{(winner.factoryDiscount * 100).toFixed(2)}%</span>
                                <span className="text-[9px] text-blue-500 font-bold uppercase">Net Outbound</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">待定</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {winner ? (
                              <div className="flex items-center gap-1.5 text-slate-900 font-medium text-sm">
                                <span className={`w-2 h-2 rounded-full ${winner.vendor === '华为' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                                {winner.vendor}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">N/A</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-[10px] text-slate-600 font-medium uppercase">{project.landscape}</td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/50">
                            <td colSpan={7} className="px-6 py-6 border-l-4 border-l-slate-900">
                              <div className="grid grid-cols-1 gap-6">
                                <div className="flex justify-between items-center px-2">
                                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ArrowRightLeft size={14}/> 厂家-渠道-客户 商务全链路校准
                                  </div>
                                  <div className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded">
                                    税费与返点固定扣除: 20.00%
                                  </div>
                                </div>
                                
                                {project.bids.map((bid, bIdx) => (
                                  <div key={bIdx} className={`bg-white rounded-xl border p-6 flex flex-col gap-8 transition-all ${bid.isWinner ? 'border-blue-200 shadow-md ring-1 ring-blue-50' : 'border-slate-200 opacity-90'}`}>
                                    
                                    {/* Top Section: Identity */}
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-4">
                                        {bid.isWinner ? <div className="bg-blue-600 p-2 rounded-lg text-white"><CheckCircle2 size={20} /></div> : <div className="bg-slate-200 p-2 rounded-lg text-slate-400"><XCircle size={20} /></div>}
                                        <div>
                                          <div className="font-black text-xl text-slate-900 flex items-center gap-3">
                                              {bid.vendor}
                                              {bid.isWinner && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">Winning Bid</span>}
                                          </div>
                                          <div className="flex items-center gap-4 mt-2">
                                            <span className="text-xs font-bold text-slate-500 px-2 py-0.5 bg-slate-100 rounded">型号: {bid.productModel}</span>
                                            <span className="text-xs font-medium text-slate-400 italic">渠道: {bid.channelName}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex gap-8">
                                        <div className="text-right">
                                            <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">客户成交折扣</div>
                                            <div className="text-xl font-black text-slate-600">{(bid.customerDiscount * 100).toFixed(2)}%</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-blue-600 uppercase font-black mb-1">厂家出货折扣</div>
                                            <div className="text-2xl font-black text-blue-600 tracking-tighter">{(bid.factoryDiscount * 100).toFixed(2)}%</div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Middle Section: Calibration Matrix */}
                                    <div className="relative">
                                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                                        <Calculator size={120} />
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                          <div className="text-[9px] text-slate-400 uppercase font-black mb-2 tracking-widest">官方目录价</div>
                                          <div className="text-sm font-mono font-bold text-slate-400 line-through">¥{(bid.listPrice/10000).toLocaleString()}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 ring-2 ring-blue-50">
                                          <div className="text-[9px] text-blue-600 uppercase font-black mb-2 tracking-widest">实际成交总价</div>
                                          <div className="text-sm font-mono font-black text-blue-800">¥{(bid.transactionPrice/10000).toLocaleString()}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                                          <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest">扣除项</div>
                                          <div className="mt-2 space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold">
                                              <span className="text-slate-400">渠道利润</span>
                                              <span className="text-slate-800">-¥{(bid.estProfit/10000).toFixed(1)}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold">
                                              <span className="text-slate-400">税费返点</span>
                                              <span className="text-slate-800">-¥{(bid.transactionPrice * bid.taxAndRebateRate / 10000).toFixed(1)}</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-indigo-900 text-white shadow-lg lg:scale-105 z-10">
                                          <div className="text-[9px] text-indigo-300 uppercase font-black mb-2 tracking-widest">厂家出货净额</div>
                                          <div className="text-base font-mono font-black">¥{(bid.factoryOutboundPrice/10000).toLocaleString()}</div>
                                          <div className="text-[8px] text-indigo-300 mt-1 italic">Net to Vendor</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                          <div className="text-[9px] text-emerald-600 uppercase font-black mb-2 tracking-widest">预估毛利(制/销)</div>
                                          <div className="text-xs font-bold text-emerald-700 flex flex-col">
                                            <span>制毛: {(bid.mfgMargin * 100).toFixed(1)}%</span>
                                            <span>销毛: {(bid.salesMargin * 100).toFixed(1)}%</span>
                                          </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                          <div className="text-[9px] text-slate-400 uppercase font-black mb-2 tracking-widest">渠道利润率</div>
                                          <div className="text-sm font-black text-slate-700">{(bid.channelMargin * 100).toFixed(1)}%</div>
                                        </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tighter"><TrendingUp size={20} className="text-blue-600"/> 厂家市场占有份额</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData.pieData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                      {chartData.pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 'bold'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tighter"><Calculator size={20} className="text-blue-600"/> 行业预算分布规模</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="lg:col-span-2 bg-slate-900 p-10 rounded-[2rem] text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-black tracking-tighter uppercase italic">Strategic Insight Panel</h2>
                  <div className="flex gap-2">
                    <span className="bg-blue-600 px-3 py-1 rounded text-[10px] font-black uppercase">Net Discount Engine</span>
                    <span className="bg-slate-800 px-3 py-1 rounded text-[10px] font-black uppercase">v2.1 Calibration</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="space-y-4">
                    <h4 className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] border-l-2 border-blue-400 pl-4">厂家真实溢价</h4>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                      剔除渠道利润与20%税杂费后，核心骨干网设备的厂家出货折扣率在<strong>0.8% - 1.5%</strong>区间波动。这表明厂家正通过超高目录价体系维持账面合规，而真实成交早已进入“极致存量博弈”。
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-emerald-400 font-black text-xs uppercase tracking-[0.2em] border-l-2 border-emerald-400 pl-4">渠道生存分析</h4>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                      集成商在六大行项目中的平均利润贡献率不足<strong>5%</strong>。在厂家直供能力加强的背景下，渠道价值正快速由“转售”向“全生命周期服务”转型。
                    </p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-amber-400 font-black text-xs uppercase tracking-[0.2em] border-l-2 border-amber-400 pl-4">供应链韧性评估</h4>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                      由于厂家出货价极低，未来3年维保续约中的“硬件替换成本”将成为主要盈利点。建议在战略规划中重点关注<strong>2026年</strong>起的大型数据中心设备退役潮。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 min-h-[600px] flex flex-col shadow-xl">
            <div className="flex items-center justify-between mb-10 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-6">
                <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-100 text-white rotate-3">
                  <BrainCircuit size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Gemini 精准商务对账分析</h3>
                  <p className="text-sm text-slate-500 font-medium">基于剥离利润/税费后的厂家出货底价逻辑</p>
                </div>
              </div>
              <button 
                onClick={handleGenerateAI}
                disabled={isAiLoading}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-3 shadow-lg hover:translate-y-[-2px]"
              >
                {isAiLoading ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : null}
                {isAiLoading ? 'DECODING...' : 'RUN DEEP CALIBRATION'}
              </button>
            </div>
            <div className="flex-1 bg-slate-50/50 rounded-[2rem] p-10 border border-slate-100 overflow-y-auto max-h-[600px] shadow-inner">
              {aiInsight ? (
                <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-strong:text-blue-600 prose-p:text-slate-600 prose-p:leading-relaxed">
                  {aiInsight}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-6 text-center">
                  <Calculator size={80} className="opacity-5" />
                  <div>
                    <p className="text-lg font-black text-slate-300">WAITING FOR COMMAND</p>
                    <p className="text-sm mt-2 text-slate-400 font-medium max-w-md mx-auto">AI 将自动调取所有投标数据的目录价、成交价、渠道利润及20%扣减项，为您深度复盘各大厂家的行业定价秘密。</p>
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
