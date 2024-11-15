"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeftCircle, Wallet, CreditCard, Store } from 'lucide-react';

const NetworkGraph = ({ nodes, connections, activeFlow, step }) => {
  const radius = 200;
  const center = { x: 300, y: 250 };
  const nodePositions = {};
  const getPathKey = (start, end, type) => `${start}-${end}-${type}`;
  
  // Position all nodes except merchant in a circle
  const regularNodes = Object.keys(nodes).filter(name => name !== 'فروشگاه');
  regularNodes.forEach((nodeName, index) => {
    const angle = (index * 2 * Math.PI) / regularNodes.length;
    nodePositions[nodeName] = {
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    };
  });
  
  // Position merchant at the bottom center
  nodePositions['فروشگاه'] = {
    x: center.x,
    y: center.y + radius + 80
  };

  const AnimatedPath = ({ start, end, isActive, progress, amount, usedAmount }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    const midX = (start.x + end.x) / 2 - dy * 0.2;
    const midY = (start.y + end.y) / 2 + dx * 0.2;
    
    const d = `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
    
    return (
      <>
        <path
          d={d}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2"
        />
        {isActive && (
          <path
            d={d}
            fill="none"
            stroke="#10b981"
            strokeWidth="4"
            strokeDasharray={length}
            strokeDashoffset={length * (1 - progress)}
            className="transition-all duration-700"
          />
        )}
        <text>
          <textPath
            href={`#${start.name}-${end.name}`}
            startOffset="50%"
            className="text-xs"
          >
            {amount ? `${(amount / 1000000).toLocaleString('fa-IR')}M` : ''}
            {usedAmount ? ` (${(usedAmount / 1000000).toLocaleString('fa-IR')}M استفاده شده)` : ''}
          </textPath>
        </text>
        <path
          id={`${start.name}-${end.name}`}
          d={d}
          fill="none"
          className="text-path"
        />
      </>
    );
  };

  return (
    <svg width="600" height="600" className="mx-auto">
      {/* Draw connections */}
      {connections.map((conn) => (
        <AnimatedPath
          key={`${conn.from}-${conn.to}`}
          start={{...nodePositions[conn.from], name: conn.from}}
          end={{...nodePositions[conn.to], name: conn.to}}
          isActive={activeFlow?.path?.includes(conn.from) && 
                   activeFlow?.path?.includes(conn.to)}
          progress={activeFlow?.progress || 0}
          amount={conn.credit}
          usedAmount={conn.used}
        />
      ))}
      
      {/* Draw nodes */}
      {Object.entries(nodes).map(([name, data]) => (
        <g
          key={name}
          transform={`translate(${nodePositions[name].x}, ${nodePositions[name].y})`}
          className="transition-all duration-300"
        >
          <circle
            r="45"
            fill={activeFlow?.path?.includes(name) ? '#10b981' : '#ffffff'}
            stroke={activeFlow?.path?.includes(name) ? '#059669' : '#e2e8f0'}
            strokeWidth="2"
          />
          {name === 'فروشگاه' ? (
            <Store
              className={`w-6 h-6 ${activeFlow?.path?.includes(name) ? 'text-white' : 'text-gray-600'}`}
              style={{ transform: 'translate(-12px, -12px)' }}
            />
          ) : null}
          <text
            textAnchor="middle"
            dy="-10"
            fill={activeFlow?.path?.includes(name) ? '#ffffff' : '#000000'}
            className="text-sm font-bold"
          >
            {name}
          </text>
          <text
            textAnchor="middle"
            dy="10"
            fill={activeFlow?.path?.includes(name) ? '#ffffff' : '#64748b'}
            className="text-xs"
          >
            {(data.credit / 1000000).toLocaleString('fa-IR')}M تومان
          </text>
          {data.received && (
            <text
              textAnchor="middle"
              dy="25"
              fill="#10b981"
              className="text-xs"
            >
              +{(data.received / 1000000).toLocaleString('fa-IR')}M دریافتی
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};

const StepDescription = ({ step, isActive }) => (
  <Card className={`
    transition-all duration-300
    ${isActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'}
  `}>
    <CardContent className="p-4">
      <div className="text-right space-y-2">
        <div className="font-bold">{step.title}</div>
        <div className="text-sm text-gray-600 leading-6">{step.description}</div>
      </div>
    </CardContent>
  </Card>
);

const CreditFlowNetwork = () => {
  const [step, setStep] = useState(0);
  const [network, setNetwork] = useState({
    nodes: {
      'سعید': { credit: 30000000 },
      'حسین': { credit: 100000000 },
      'عباس': { credit: 50000000 },
      'هادی': { credit: 70000000 },
      'داوود': { credit: 50000000 },
      'فروشگاه': { credit: 0, received: 0 }
    },
    connections: [
      { from: 'حسین', to: 'سعید', credit: 50000000, used: 0 },
      { from: 'عباس', to: 'سعید', credit: 50000000, used: 0 },
      { from: 'هادی', to: 'حسین', credit: 50000000, used: 0 },
      { from: 'داوود', to: 'حسین', credit: 50000000, used: 0 },
      { from: 'داوود', to: 'عباس', credit: 50000000, used: 0 },
      { from: 'سعید', to: 'فروشگاه', credit: 0, used: 0 }
    ]
  });

  const steps = [
    {
      title: "شبکه اولیه",
      description: "نمایش اعتبار اولیه افراد و خطوط اعتماد بین آنها",
      flow: null
    },
    {
      title: "خرید مستقیم - مرحله ۱",
      description: "سعید قصد خرید ۲۰ میلیون تومانی دارد. سیستم اعتبار شخصی او را بررسی می‌کند.",
      flow: {
        path: ['سعید'],
        progress: 1
      }
    },
    {
      title: "خرید مستقیم - مرحله ۲",
      description: "سیستم ۲۰ میلیون تومان از اعتبار سعید کم می‌کند",
      flow: {
        path: ['سعید'],
        progress: 1,
        changes: {
          'سعید': -20000000
        }
      }
    },
    {
      title: "خرید مستقیم - مرحله ۳",
      description: "اعتبار به حساب فروشگاه منتقل می‌شود",
      flow: {
        path: ['سعید', 'فروشگاه'],
        progress: 1,
        changes: {
          'فروشگاه': { received: 20000000 }
        }
      }
    },
    {
      title: "خرید ترکیبی - مرحله ۱",
      description: "سعید قصد خرید ۴۰ میلیون تومانی دارد. سیستم مسیرهای اعتباری را بررسی می‌کند.",
      flow: {
        path: ['حسین', 'سعید', 'عباس'],
        progress: 0.3
      }
    },
    {
      title: "خرید ترکیبی - مرحله ۲",
      description: "سیستم ۱۰ میلیون تومان از اعتبار باقیمانده سعید استفاده می‌کند",
      flow: {
        path: ['سعید'],
        progress: 1,
        changes: {
          'سعید': -10000000
        }
      }
    },
    {
      title: "خرید ترکیبی - مرحله ۳",
      description: "۲۰ میلیون تومان از خط اعتباری حسین استفاده می‌شود",
      flow: {
        path: ['حسین', 'سعید'],
        progress: 1,
        changes: {
          'حسین': -20000000
        },
        trustLineChanges: {
          from: 'حسین',
          to: 'سعید',
          used: 20000000
        }
      }
    },
    {
      title: "خرید ترکیبی - مرحله ۴",
      description: "۱۰ میلیون تومان از خط اعتباری عباس استفاده می‌شود",
      flow: {
        path: ['عباس', 'سعید'],
        progress: 1,
        changes: {
          'عباس': -10000000
        },
        trustLineChanges: {
          from: 'عباس',
          to: 'سعید',
          used: 10000000
        }
      }
    },
    {
      title: "خرید ترکیبی - مرحله ۵",
      description: "مجموع ۴۰ میلیون تومان به حساب فروشگاه منتقل می‌شود",
      flow: {
        path: ['سعید', 'فروشگاه'],
        progress: 1,
        changes: {
          'فروشگاه': { received: 40000000 }
        }
      }
    },
    // Find the steps array and add these new scenarios at the end:

// Previous scenarios remain unchanged...
{
  title: "خرید پیچیده - تنظیم خط اعتباری",
  description: "عباس خط اعتباری خود به سعید را به ۷۰ میلیون تومان افزایش می‌دهد. از این مقدار ۱۰ میلیون قبلاً استفاده شده و ۶۰ میلیون باقی مانده است.",
  flow: {
    path: ['عباس', 'سعید'],
    progress: 1,
    trustLineUpdates: [
      { from: 'عباس', to: 'سعید', newCredit: 70000000 }
    ]
  }
},
{
  title: "خرید پیچیده - درخواست خرید",
  description: "سعید قصد خرید ۸۰ میلیون تومانی دارد. سیستم مسیرهای اعتباری را بررسی می‌کند.",
  flow: {
    path: ['حسین', 'سعید', 'عباس', 'داوود'],
    progress: 0.3
  }
},
{
  title: "خرید پیچیده - مرحله ۱",
  description: "سیستم ۳۰ میلیون تومان از باقیمانده خط اعتباری حسین استفاده می‌کند",
  flow: {
    path: ['حسین', 'سعید'],
    progress: 1,
    changes: {
      'حسین': -30000000
    },
    trustLineChanges: {
      from: 'حسین',
      to: 'سعید',
      used: 30000000
    }
  }
},
{
  title: "خرید پیچیده - مرحله ۲",
  description: "عباس قصد دارد ۵۰ میلیون به سعید اعتبار دهد، اما تنها ۴۰ میلیون اعتبار دارد",
  flow: {
    path: ['عباس', 'داوود'],
    progress: 1
  }
},
{
  title: "خرید پیچیده - مرحله ۳",
  description: "عباس ۱۰ میلیون تومان از خط اعتباری داوود استفاده می‌کند",
  flow: {
    path: ['داوود', 'عباس'],
    progress: 1,
    changes: {
      'داوود': -10000000
    },
    trustLineChanges: {
      from: 'داوود',
      to: 'عباس',
      used: 10000000
    }
  }
},
{
  title: "خرید پیچیده - مرحله ۴",
  description: "حال عباس می‌تواند ۵۰ میلیون تومان به سعید اعتبار دهد",
  flow: {
    path: ['عباس', 'سعید'],
    progress: 1,
    changes: {
      'عباس': -40000000
    },
    trustLineChanges: {
      from: 'عباس',
      to: 'سعید',
      used: 50000000
    }
  }
},
{
  title: "خرید پیچیده - مرحله نهایی",
  description: "مجموع ۸۰ میلیون تومان به حساب فروشگاه منتقل می‌شود",
  flow: {
    path: ['سعید', 'فروشگاه'],
    progress: 1,
    changes: {
      'فروشگاه': { received: 80000000 }
    }
  }
}

  ];

  useEffect(() => {
    if (steps[step]?.flow?.trustLineUpdates) {
      setNetwork(prev => ({
        ...prev,
        connections: prev.connections.map(conn => {
          const update = steps[step].flow.trustLineUpdates.find(
            u => u.from === conn.from && u.to === conn.to
          );
          if (update) {
            return { ...conn, credit: update.newCredit };
          }
          return conn;
        })
      }));
    }
    if (steps[step]?.flow?.changes) {
      setNetwork(prev => ({
        ...prev,
        nodes: Object.entries(prev.nodes).reduce((acc, [name, data]) => {
          const change = steps[step].flow.changes[name];
          if (typeof change === 'object') {
            return {
              ...acc,
              [name]: { ...data, ...change }
            };
          }
          return {
            ...acc,
            [name]: { ...data, credit: data.credit + (change || 0) }
          };
        }, {})
      }));
    }
    
    if (steps[step]?.flow?.trustLineChanges) {
      const { from, to, used } = steps[step].flow.trustLineChanges;
      setNetwork(prev => ({
        ...prev,
        connections: prev.connections.map(conn => {
          if (conn.from === from && conn.to === to) {
            return { ...conn, used: (conn.used || 0) + used };
          }
          return conn;
        })
      }));
    }
    
  }, [step]);

// In CreditNetwork.js, update the return statement of CreditFlowNetwork component:

return (
  <div className="container mx-auto p-4 font-vazirmatn min-h-screen flex flex-col" dir="rtl">
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-right">
          نمایش جریان اعتبار در شبکه اعتماد
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Graph section */}
          <div className="lg:col-span-2 bg-white rounded-lg p-4">
            <NetworkGraph
              nodes={network.nodes}
              connections={network.connections}
              activeFlow={steps[step]?.flow}
              step={step}
            />
          </div>
          
          {/* Steps section - now with fixed height and scroll */}
          <div className="lg:h-[600px] flex flex-col">
            {/* Steps cards in scrollable container */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
              {steps.map((stepData, idx) => (
                <StepDescription
                  key={idx}
                  step={stepData}
                  isActive={idx === step}
                />
              ))}
            </div>
            
            {/* Navigation buttons in fixed position */}
            <div className="sticky bottom-0 bg-white pt-4 border-t">
              <div className="flex justify-between gap-4">
                <Button
                  onClick={() => {
                    setStep(Math.max(step - 1, 0));
                    // Scroll to top of content if needed
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={step === 0}
                  variant="outline"
                >
                  مرحله قبل
                </Button>
                <Button
                  onClick={() => {
                    setStep(Math.min(step + 1, steps.length - 1));
                    // Scroll to top of content if needed
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={step === steps.length - 1}
                  className="bg-gradient-to-l from-teal-600 to-emerald-500 text-white"
                >
                  مرحله بعد
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);
};

export default CreditFlowNetwork;