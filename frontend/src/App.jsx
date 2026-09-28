import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Send, ChevronDown, ChevronUp, AlertCircle, Clock, Database, Brain, BugPlay } from 'lucide-react';
import { 
  BarChart, Bar, 
  PieChart as RechartsPieChart, Pie, Cell, 
  LineChart as RechartsLineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Global uniform premium color palette
const CHART_COLORS = ['#4F46E5', '#059669', '#D97706', '#DC2626'];
const INITIAL_PROMPT = 'analyse this table, give me first 20 clients details and present it in a graphical format.';

function StatusIndicator({ label, isOk, icon: Icon }) {
  return (
    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
      <Icon className="w-3.5 h-3.5 text-slate-500" />
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="relative flex h-2.5 w-2.5 ml-1">
        {isOk ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        )}
      </div>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="w-full bg-white rounded-xl shadow-md p-8 border border-slate-100 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-1/3 mb-8"></div>
      <div className="h-64 bg-slate-100 rounded w-full"></div>
    </div>
  );
}

function ErrorCard({ error }) {
  return (
    <div className="w-full bg-red-50 rounded-xl p-6 border border-red-100 flex items-start space-x-4">
      <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
      <div>
        <h3 className="text-red-800 font-medium">Generation Failed</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
      </div>
    </div>
  );
}

function DataViewer({ rawData }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!rawData) return null;

  return (
    <div className="mt-8 border border-slate-200 rounded-lg overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-sm font-medium text-slate-700 transition-colors"
      >
        <span>View raw data</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="p-4 bg-white overflow-x-auto border-t border-slate-200">
          <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function TypingTitle({ title, onComplete }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let currentIndex = 0;
    const fallbackTitle = title || 'Generated Chart';
    // Aim for ~500ms total duration
    const speed = Math.max(20, Math.floor(500 / fallbackTitle.length));
    
    const interval = setInterval(() => {
      if (currentIndex < fallbackTitle.length) {
        setDisplayedText(fallbackTitle.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        onComplete();
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [title, onComplete]);

  return (
    <h2 className="text-xl font-semibold text-slate-800 mb-8 min-h-[28px] flex items-center">
      {displayedText}
      <span className="animate-pulse ml-0.5 w-2 h-5 bg-slate-400 inline-block"></span>
    </h2>
  );
}

function ClientCards({ clients }) {
  const [showAll, setShowAll] = useState(false);
  
  if (!clients || clients.length === 0) return null;
  
  const displayClients = showAll ? clients : clients.slice(0, 12);
  
  const getStatusColor = (status) => {
    switch (String(status).toLowerCase()) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'inactive':
      case 'churned': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="w-full mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
      <h3 className="text-xl font-semibold text-slate-800">Client Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayClients.map((client, i) => (
          <div key={client.id || i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="overflow-hidden pr-2">
                <h4 className="font-bold text-slate-900 truncate">{client.name || 'Unknown Client'}</h4>
                <p className="text-sm text-slate-500 truncate">{client.company || 'No Company'}</p>
              </div>
              {client.status && (
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 capitalize", getStatusColor(client.status))}>
                  {client.status}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-y-2 mt-4 pt-4 border-t border-slate-100 text-sm">
               {client.industry !== undefined ? (
                 <>
                   <span className="text-slate-500 text-xs font-medium">Industry</span>
                   <span className="text-slate-800 font-medium text-right truncate">{client.industry}</span>
                 </>
               ) : client.assigned_agent !== undefined && (
                 <>
                   <span className="text-slate-500 text-xs font-medium">Agent</span>
                   <span className="text-slate-800 font-medium text-right truncate">{client.assigned_agent}</span>
                 </>
               )}
               
               {client.revenue !== undefined ? (
                 <>
                   <span className="text-slate-500 text-xs font-medium">Revenue</span>
                   <span className="text-slate-800 font-medium text-right truncate">${Number(client.revenue).toLocaleString()}</span>
                 </>
               ) : client.email !== undefined && (
                 <>
                   <span className="text-slate-500 text-xs font-medium">Email</span>
                   <span className="text-slate-800 font-medium text-right truncate" title={client.email}>{client.email}</span>
                 </>
               )}
               
               {client.region !== undefined ? (
                 <>
                   <span className="text-slate-500 text-xs font-medium">Region</span>
                   <span className="text-slate-800 font-medium text-right truncate">{client.region}</span>
                 </>
               ) : client.phone !== undefined && (
                 <>
                   <span className="text-slate-500 text-xs font-medium">Phone</span>
                   <span className="text-slate-800 font-medium text-right truncate">{client.phone}</span>
                 </>
               )}
            </div>
          </div>
        ))}
      </div>
      
      {clients.length > 12 && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200 shadow-sm hover:shadow"
          >
            {showAll ? 'Show less' : `Show ${clients.length - 12} more clients`}
          </button>
        </div>
      )}
    </div>
  );
}

function ProductPositioningBlock() {
  const steps = [
    {
      title: "Prompt Intake",
      desc: "Your natural-language request (\"show me the first 20 clients...\") is sent to the backend as-is. No hardcoded logic is guessing what you meant — the system reads the actual intent from your words."
    },
    {
      title: "Deterministic Data Retrieval",
      desc: "Before any AI model is involved, the backend queries the local SQLite database directly for the exact client records needed. This step is 100% accurate by design — it's a plain database read, not a guess, so the numbers you see are never \"hallucinated,\" they're pulled straight from the source table."
    },
    {
      title: "Structured Handoff to the Local Model",
      desc: "The retrieved data, along with your original request, is passed to a small language model (Qwen2.5, 1.5B parameters) running entirely on this machine — no cloud API, no data ever leaves this system. The model isn't asked to \"figure out\" the data; it's given the correct data already, and asked only to organize it into a defined output structure: which chart types make sense, how to group the data, and how to label it clearly."
    },
    {
      title: "Schema Enforcement + Self-Correction",
      desc: "The model is instructed to respond only in a strict JSON format. If it ever returns something malformed, the system automatically detects this and asks the model to retry with a stricter instruction — a self-correcting layer that prevents a bad AI response from ever reaching the interface broken."
    },
    {
      title: "Multi-View Visualization Logic",
      desc: "Rather than cramming every client into one chart (which gets unreadable past a handful of records), the system generates multiple, purpose-built views automatically: a per-client breakdown for granular detail, and aggregated views (by industry, by status) that stay clear no matter how many clients are in the result. The right visualization is chosen based on what actually keeps the data readable — not a fixed, one-size-fits-all chart."
    },
    {
      title: "Live Reliability Layer",
      desc: "The interface continuously checks that both the local database and the local model server are alive and responding, before you're ever allowed to run a query — so a failure is caught and shown clearly, instead of failing silently."
    }
  ];

  return (
    <div className="w-full bg-slate-100/50 py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 mt-20">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-12 tracking-tight">How This Works — Under the Hood</h2>
        
        <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 space-y-10 pb-8">
          {steps.map((step, idx) => (
            <div key={idx} className="relative pl-8 md:pl-10">
              <div className="absolute -left-[17px] top-0.5 bg-slate-100 border-4 border-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-slate-600">{idx + 1}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-agent-50 border border-agent-200 rounded-xl p-6 shadow-sm">
          <p className="text-agent-900 font-medium leading-relaxed">
            <span className="font-bold text-agent-700 uppercase text-sm tracking-wider block mb-2">In short</span>
            The AI model here is never the source of truth — it's the last step in a pipeline that controls, verifies, and structures its output. That's the same architectural principle behind serious production AI systems: accuracy comes from the pipeline around the model, not blind trust in the model itself.
          </p>
        </div>
      </div>
    </div>
  );
}

function ChartRenderer({ chart }) {
  const [titleTyped, setTitleTyped] = useState(false);
  const handleTitleComplete = useCallback(() => setTitleTyped(true), []);

  if (!chart || !chart.datasets || chart.datasets.length === 0) return null;

  const { chartType, title, labels, datasets } = chart;
  
  const chartData = labels.map((label, index) => {
    const dataPoint = { name: label };
    datasets.forEach(ds => {
      const val = Number(ds.data[index]);
      dataPoint[ds.label] = isNaN(val) ? 0 : val; 
    });
    return dataPoint;
  });

  const isManyDataPoints = labels && labels.length > 10;
  const isHorizontalBar = chartType?.toLowerCase() === 'bar' && isManyDataPoints;

  const renderChart = () => {
    switch (chartType?.toLowerCase()) {
      case 'pie':
        const pieData = labels.map((label, i) => {
          const val = Number(datasets[0].data[i]);
          return { name: label, value: isNaN(val) ? 0 : val };
        }).filter(item => item.value > 0); // Prevent 0-value clustering
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                animationDuration={1500}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsLineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend />
              {datasets.map((ds, i) => (
                <Line 
                  key={ds.label} 
                  type="monotone" 
                  dataKey={ds.label} 
                  stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                  strokeWidth={3}
                  activeDot={{ r: 6 }} 
                  animationDuration={1500}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'bar':
      default:
        return (
          <div className={cn("w-full h-full", isHorizontalBar ? "overflow-x-auto overflow-y-hidden" : "")}>
            <div style={{ minWidth: isHorizontalBar ? `${Math.max(labels.length * 40, 500)}px` : '100%', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  layout={isHorizontalBar ? "vertical" : "horizontal"}
                  margin={isHorizontalBar ? { top: 20, right: 30, left: 100, bottom: 5 } : { top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={!isHorizontalBar} vertical={isHorizontalBar} stroke="#e2e8f0" />
                  {isHorizontalBar ? (
                    <>
                      <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={90} />
                    </>
                  ) : (
                    <>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    </>
                  )}
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend />
                  {datasets.map((ds, i) => (
                    <Bar 
                      key={ds.label} 
                      dataKey={ds.label} 
                      stackId="a"
                      maxBarSize={isHorizontalBar ? 20 : 60}
                      fill={CHART_COLORS[i % CHART_COLORS.length]} 
                      radius={isHorizontalBar ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                      animationDuration={1500}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-md p-6 sm:p-8 border border-slate-100 flex flex-col h-full">
      <TypingTitle title={title} onComplete={handleTitleComplete} />
      {titleTyped && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex-grow w-full">
          {renderChart()}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [prompt, setPrompt] = useState(INITIAL_PROMPT);
  const [history, setHistory] = useState([]);
  const [generationTime, setGenerationTime] = useState(null);
  const [testFailure, setTestFailure] = useState(false);
  
  const startTimeRef = useRef(null);

  // Poll healthcheck every 5s
  const { data: healthData, isError: healthIsError } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/health');
        return res.data;
      } catch (err) {
        if (err.response && err.response.data) return err.response.data;
        return { db: 'error', ollama: 'error' };
      }
    },
    refetchInterval: 5000,
  });

  const dbOk = healthData?.db === 'ok';
  const ollamaOk = healthData?.ollama === 'ok';
  const servicesReady = dbOk && ollamaOk && !healthIsError;

  const mutation = useMutation({
    mutationFn: async (text) => {
      const res = await axios.post('http://localhost:5000/api/agent/query', { 
        prompt: text, 
        testFailure 
      }, { timeout: 125000 }); // Frontend times out shortly after backend's 120s timeout
      return res.data;
    },
    onMutate: () => {
      startTimeRef.current = performance.now();
      setGenerationTime(null);
    },
    onSuccess: (data, variables) => {
      const endTime = performance.now();
      setGenerationTime(((endTime - startTimeRef.current) / 1000).toFixed(1));
      setHistory(prev => {
        const filtered = prev.filter(p => p !== variables);
        return [variables, ...filtered].slice(0, 3);
      });
    },
    onError: () => {
        setGenerationTime(null);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || mutation.isPending || !servicesReady) return;
    mutation.mutate(prompt);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Top Status Bar */}
      <div className="fixed top-4 right-4 flex space-x-3 z-50">
        <StatusIndicator label="Database" isOk={dbOk} icon={Database} />
        <StatusIndicator label="Local Model" isOk={ollamaOk} icon={Brain} />
      </div>

      <div className="w-full max-w-6xl mx-auto space-y-10 mt-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Data Intelligence Agent
          </h1>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">
            Local SQLite → Agentic Query Layer → Local SLM (Qwen 2.5) → Visualized Output
          </p>
        </div>

        {/* Main Input Area */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="p-2 relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask the agent to analyze data..."
              className="w-full min-h-[120px] p-4 text-slate-700 bg-transparent resize-none focus:outline-none text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="absolute bottom-4 right-4 flex items-center space-x-3">
              {!servicesReady && (
                <span className="text-xs text-red-500 font-medium mr-2">Services offline</span>
              )}
              <button
                type="submit"
                disabled={mutation.isPending || !prompt.trim() || !servicesReady}
                className={cn(
                  "flex items-center space-x-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-200",
                  (mutation.isPending || !prompt.trim() || !servicesReady)
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                    : "bg-agent-600 text-white hover:bg-agent-500 shadow-sm hover:shadow active:scale-95"
                )}
              >
                <span>{mutation.isPending ? 'Analyzing...' : 'Run'}</span>
                <Send className="w-4 h-4 ml-1" />
              </button>
            </div>
          </form>
          
          {/* History */}
          {history.length > 0 && (
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
              <div className="flex items-center text-xs text-slate-500 space-x-3">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">Recent:</span>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(h)}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-full hover:border-agent-500 hover:text-agent-600 transition-colors whitespace-nowrap truncate max-w-[200px]"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="w-full transition-all duration-500 min-h-[300px]">
          {mutation.isPending && (
            <div className="transition-opacity duration-500 opacity-100 max-w-4xl mx-auto">
               <SkeletonLoader />
            </div>
          )}
          
          {mutation.isError && !mutation.isPending && (
            <div className="transition-opacity duration-500 opacity-100 max-w-4xl mx-auto">
              <ErrorCard error={mutation.error?.response?.data?.error || mutation.error?.message || 'An unknown error occurred'} />
              {mutation.error?.response?.data?.raw && (
                  <div className="mt-4 p-4 bg-white rounded-xl shadow-sm text-sm overflow-x-auto">
                      <p className="font-medium text-slate-700 mb-2">Raw Model Output:</p>
                      <pre className="text-xs text-slate-500">{mutation.error.response.data.raw}</pre>
                  </div>
              )}
            </div>
          )}
          
          {mutation.isSuccess && mutation.data?.success && !mutation.isPending && (
            <div className="space-y-6 transition-opacity duration-500 opacity-100">
              
              {/* Responsive Grid of Charts */}
              {mutation.data.data.charts && mutation.data.data.charts.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                  {mutation.data.data.charts.map((chart, idx) => (
                    <ChartRenderer key={idx} chart={chart} />
                  ))}
                </div>
              ) : (
                <ChartRenderer chart={mutation.data.data} /> /* Fallback if model still returns old schema */
              )}
              
              <div className="max-w-4xl mx-auto">
                <DataViewer rawData={mutation.data.data} />
              </div>
              
              <ClientCards clients={mutation.data.data.clientDetails} />
              
              {generationTime && (
                <div className="flex justify-end pr-2 max-w-4xl mx-auto">
                  <span className="text-xs font-medium text-slate-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Generated in {generationTime}s
                  </span>
                </div>
              )}
            </div>
          )}

          {mutation.isSuccess && !mutation.data?.success && !mutation.isPending && (
             <div className="transition-opacity duration-500 opacity-100 max-w-4xl mx-auto">
               <ErrorCard error={mutation.data?.error || 'Failed to parse response'} />
             </div>
          )}
        </div>
      </div>

      {/* Dev-only Toggle */}
      <div className="w-full flex justify-center pb-8 mt-12 opacity-30 hover:opacity-100 transition-opacity">
        <label className="flex items-center space-x-2 text-xs font-medium text-slate-400 cursor-pointer">
          <input 
            type="checkbox" 
            checked={testFailure}
            onChange={(e) => setTestFailure(e.target.checked)}
            className="rounded border-slate-300 text-agent-500 focus:ring-agent-500"
          />
          <BugPlay className="w-3 h-3" />
          <span>Simulate model error (dev mode)</span>
        </label>
      </div>
      
      <ProductPositioningBlock />
    </div>
  );
}
