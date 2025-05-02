import * as math from 'mathjs';
import React, { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './App.css';

export default function App() {
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [previousKeyType, setPreviousKeyType] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [graphFunction, setGraphFunction] = useState('sin(x)');
  const [graphData, setGraphData] = useState([]);
  const [graphRange, setGraphRange] = useState({ min: -10, max: 10, points: 100 });
  
  const clearAll = () => {
    setDisplay('0');
    setWaitingForOperand(false);
    setPreviousKeyType('');
  };
  
  const clearDisplay = () => {
    setDisplay('0');
    setWaitingForOperand(false);
  };
  
  const toggleSign = () => {
    setDisplay(display.charAt(0) === '-' ? display.substring(1) : '-' + display);
  };
  
  const addDigit = (digit) => {
    if (display === '0' || waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display + digit);
    }
    setPreviousKeyType('digit');
  };
  
  const addDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
    setPreviousKeyType('decimal');
  };
  
  const performOperation = (nextOperator) => {
    try {
      const result = math.evaluate(display);
      const formattedResult = formatResult(result);
      
      setHistory([...history, `${display} = ${formattedResult}`]);
      setDisplay(formattedResult);
      setWaitingForOperand(true);
      setPreviousKeyType('operator');
    } catch (error) {
      setDisplay('Error');
      setWaitingForOperand(true);
    }
  };
  
  const formatResult = (value) => {
    const stringValue = value.toString();
    if (stringValue.includes('e')) {
      return stringValue;
    }
    
    const maxDigits = 10;
    if (stringValue.length > maxDigits) {
      if (stringValue.includes('.')) {
        const parts = stringValue.split('.');
        const integerPart = parts[0];
        if (integerPart.length >= maxDigits) {
          return value.toExponential(maxDigits - 5);
        } else {
          const decimalPlaces = maxDigits - integerPart.length - 1;
          return value.toFixed(decimalPlaces);
        }
      } else {
        return value.toExponential(maxDigits - 5);
      }
    }
    return stringValue;
  };
  
  const calculateSpecialFunction = (func) => {
    try {
      let result;
      const value = parseFloat(display);
      
      switch(func) {
        case 'sin':
          result = math.sin(value);
          break;
        case 'cos':
          result = math.cos(value);
          break;
        case 'tan':
          result = math.tan(value);
          break;
        case 'asin':
          result = math.asin(value);
          break;
        case 'acos':
          result = math.acos(value);
          break;
        case 'atan':
          result = math.atan(value);
          break;
        case 'log10':
          result = math.log10(value);
          break;
        case 'ln':
          result = math.log(value);
          break;
        case 'exp':
          result = math.exp(value);
          break;
        case 'sqrt':
          result = math.sqrt(value);
          break;
        case 'square':
          result = math.pow(value, 2);
          break;
        case 'cube':
          result = math.pow(value, 3);
          break;
        case 'fact':
          result = math.factorial(value);
          break;
        case 'derivative':
          // Simple numerical derivative approximation
          try {
            const expr = math.parse(display);
            const derivative = math.derivative(expr, 'x');
            result = derivative.evaluate({x: 1}); // Evaluate at x=1 for simplicity
          } catch (e) {
            result = 'Cannot differentiate';
          }
          break;
        case 'integrate':
          // Simple numerical integration approximation (very rough)
          try {
            const expr = math.parse(display);
            // Trapezoidal rule from 0 to 1 with 100 steps
            const steps = 100;
            const stepSize = 1 / steps;
            let sum = 0;
            
            for (let i = 0; i <= steps; i++) {
              const x = i * stepSize;
              const y = expr.evaluate({x: x});
              
              // Apply trapezoidal weights
              const weight = (i === 0 || i === steps) ? 0.5 : 1;
              sum += weight * y;
            }
            
            result = sum * stepSize;
          } catch (e) {
            result = 'Cannot integrate';
          }
          break;
        default:
          result = value;
      }
      
      const formattedResult = formatResult(result);
      setHistory([...history, `${func}(${display}) = ${formattedResult}`]);
      setDisplay(formattedResult);
      setWaitingForOperand(true);
      setPreviousKeyType('function');
    } catch (error) {
      setDisplay('Error');
      setWaitingForOperand(true);
    }
  };
  
  const memoryStore = () => {
    setMemory(display);
  };
  
  const memoryRecall = () => {
    if (memory !== null) {
      setDisplay(memory);
      setWaitingForOperand(false);
    }
  };
  
  const memoryClear = () => {
    setMemory(null);
  };
  
  const memoryAdd = () => {
    if (memory !== null) {
      setMemory(formatResult(parseFloat(memory) + parseFloat(display)));
    } else {
      memoryStore();
    }
  };
  
  const memorySubtract = () => {
    if (memory !== null) {
      setMemory(formatResult(parseFloat(memory) - parseFloat(display)));
    } else {
      setMemory(formatResult(-parseFloat(display)));
    }
  };
  
  const toggleHistory = () => {
    setShowHistory(!showHistory);
    if (showGraph) setShowGraph(false);
  };
  
  const clearHistory = () => {
    setHistory([]);
  };
  
  const toggleGraph = () => {
    setShowGraph(!showGraph);
    if (showHistory) setShowHistory(false);
    
    if (!showGraph) {
      try {
        // Try to use current display as the function if it looks like a function
        if (display.includes('x') || display.includes('sin') || 
            display.includes('cos') || display.includes('tan') || 
            display.includes('log') || display.includes('exp')) {
          setGraphFunction(display);
        }
        generateGraphData();
      } catch (error) {
        console.error("Error setting up graph:", error);
      }
    }
  };
  
  const generateGraphData = () => {
    try {
      const { min, max, points } = graphRange;
      const step = (max - min) / (points - 1);
      const data = [];
      
      let expr;
      try {
        expr = math.parse(graphFunction);
      } catch (e) {
        expr = math.parse('sin(x)'); // Default to sin(x) if parsing fails
        setGraphFunction('sin(x)');
      }
      
      for (let i = 0; i < points; i++) {
        const x = min + i * step;
        let y;
        
        try {
          // Evaluate the expression at x
          y = expr.evaluate({ x });
          
          // Check if y is a valid number
          if (isNaN(y) || !isFinite(y)) {
            continue; // Skip invalid points
          }
          
          data.push({
            x: parseFloat(x.toFixed(2)),
            y: parseFloat(y.toFixed(4))
          });
        } catch (error) {
          // Skip points where evaluation fails
          continue;
        }
      }
      
      setGraphData(data);
    } catch (error) {
      console.error("Error generating graph data:", error);
    }
  };
  
  const updateGraphFunction = () => {
    setGraphFunction(display);
    generateGraphData();
  };
  
  const updateGraphRange = (key, value) => {
    const newRange = { ...graphRange, [key]: parseFloat(value) };
    setGraphRange(newRange);
  };
  
  // Generate graph data when function or range changes
  useEffect(() => {
    if (showGraph) {
      generateGraphData();
    }
  }, [graphFunction, graphRange]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="max-w-lg mx-auto w-full p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Calculator Display */}
          <div className="bg-gray-800 p-4">
            <div className="text-right text-white text-2xl font-mono h-12 flex items-center justify-end overflow-x-auto">
              {display}
            </div>
          </div>
          
          {/* Memory Indicators */}
          <div className="flex justify-between bg-gray-700 px-4 py-1 text-xs text-gray-300">
            <div>{memory !== null ? 'M' : ''}</div>
            <div>{waitingForOperand ? 'Ready' : 'Input'}</div>
          </div>
          
          {/* Calculator Buttons */}
          <div className="p-2 grid grid-cols-5 gap-1">
            {/* Memory Functions */}
            <button onClick={memoryStore} className="bg-gray-600 text-white p-2 rounded text-sm">MS</button>
            <button onClick={memoryRecall} className="bg-gray-600 text-white p-2 rounded text-sm">MR</button>
            <button onClick={memoryClear} className="bg-gray-600 text-white p-2 rounded text-sm">MC</button>
            <button onClick={memoryAdd} className="bg-gray-600 text-white p-2 rounded text-sm">M+</button>
            <button onClick={memorySubtract} className="bg-gray-600 text-white p-2 rounded text-sm">M-</button>
            
            {/* Scientific Functions - Row 1 */}
            <button onClick={() => calculateSpecialFunction('sin')} className="bg-indigo-500 text-white p-2 rounded">sin</button>
            <button onClick={() => calculateSpecialFunction('cos')} className="bg-indigo-500 text-white p-2 rounded">cos</button>
            <button onClick={() => calculateSpecialFunction('tan')} className="bg-indigo-500 text-white p-2 rounded">tan</button>
            <button onClick={() => calculateSpecialFunction('log10')} className="bg-indigo-500 text-white p-2 rounded">log</button>
            <button onClick={() => calculateSpecialFunction('ln')} className="bg-indigo-500 text-white p-2 rounded">ln</button>
            
            {/* Scientific Functions - Row 2 */}
            <button onClick={() => calculateSpecialFunction('asin')} className="bg-indigo-500 text-white p-2 rounded">asin</button>
            <button onClick={() => calculateSpecialFunction('acos')} className="bg-indigo-500 text-white p-2 rounded">acos</button>
            <button onClick={() => calculateSpecialFunction('atan')} className="bg-indigo-500 text-white p-2 rounded">atan</button>
            <button onClick={() => calculateSpecialFunction('exp')} className="bg-indigo-500 text-white p-2 rounded">e^x</button>
            <button onClick={() => calculateSpecialFunction('fact')} className="bg-indigo-500 text-white p-2 rounded">x!</button>
            
            {/* Scientific Functions - Row 3 */}
            <button onClick={() => calculateSpecialFunction('sqrt')} className="bg-indigo-500 text-white p-2 rounded">√</button>
            <button onClick={() => calculateSpecialFunction('square')} className="bg-indigo-500 text-white p-2 rounded">x²</button>
            <button onClick={() => calculateSpecialFunction('cube')} className="bg-indigo-500 text-white p-2 rounded">x³</button>
            <button onClick={() => setDisplay(math.pi.toString())} className="bg-indigo-500 text-white p-2 rounded">π</button>
            <button onClick={() => setDisplay(math.e.toString())} className="bg-indigo-500 text-white p-2 rounded">e</button>
            
            {/* Calculus Functions */}
            <button onClick={() => calculateSpecialFunction('derivative')} className="bg-purple-600 text-white p-2 rounded col-span-2">d/dx</button>
            <button onClick={() => calculateSpecialFunction('integrate')} className="bg-purple-600 text-white p-2 rounded col-span-2">∫</button>
            <button onClick={toggleSign} className="bg-gray-500 text-white p-2 rounded">±</button>
            
            {/* Clear Functions */}
            <button onClick={clearAll} className="bg-red-500 text-white p-2 rounded">AC</button>
            <button onClick={clearDisplay} className="bg-red-400 text-white p-2 rounded">C</button>
            <button onClick={() => setDisplay(display.slice(0, -1) || '0')} className="bg-red-400 text-white p-2 rounded">⌫</button>
            <button onClick={() => addDigit('(')} className="bg-gray-500 text-white p-2 rounded">(</button>
            <button onClick={() => addDigit(')')} className="bg-gray-500 text-white p-2 rounded">)</button>
            
            {/* Number Pad and Basic Operations */}
            <button onClick={() => addDigit('7')} className="bg-gray-800 text-white p-2 rounded">7</button>
            <button onClick={() => addDigit('8')} className="bg-gray-800 text-white p-2 rounded">8</button>
            <button onClick={() => addDigit('9')} className="bg-gray-800 text-white p-2 rounded">9</button>
            <button onClick={() => addDigit('/')} className="bg-yellow-500 text-white p-2 rounded">÷</button>
            <button onClick={() => addDigit('^')} className="bg-yellow-500 text-white p-2 rounded">^</button>
            
            <button onClick={() => addDigit('4')} className="bg-gray-800 text-white p-2 rounded">4</button>
            <button onClick={() => addDigit('5')} className="bg-gray-800 text-white p-2 rounded">5</button>
            <button onClick={() => addDigit('6')} className="bg-gray-800 text-white p-2 rounded">6</button>
            <button onClick={() => addDigit('*')} className="bg-yellow-500 text-white p-2 rounded">×</button>
            <button onClick={() => addDigit('x')} className="bg-indigo-500 text-white p-2 rounded">x</button>
            
            <button onClick={() => addDigit('1')} className="bg-gray-800 text-white p-2 rounded">1</button>
            <button onClick={() => addDigit('2')} className="bg-gray-800 text-white p-2 rounded">2</button>
            <button onClick={() => addDigit('3')} className="bg-gray-800 text-white p-2 rounded">3</button>
            <button onClick={() => addDigit('-')} className="bg-yellow-500 text-white p-2 rounded">−</button>
            <button onClick={() => addDigit('%')} className="bg-yellow-500 text-white p-2 rounded">%</button>
            
            <button onClick={() => addDigit('0')} className="bg-gray-800 text-white p-2 rounded col-span-2">0</button>
            <button onClick={addDecimal} className="bg-gray-800 text-white p-2 rounded">.</button>
            <button onClick={() => addDigit('+')} className="bg-yellow-500 text-white p-2 rounded">+</button>
            <button onClick={performOperation} className="bg-green-500 text-white p-2 rounded">=</button>
          </div>
          
          {/* Visualization and History Section */}
          <div className="border-t border-gray-200">
            <div className="flex justify-between p-2 bg-gray-100">
              <div className="flex space-x-2">
                <button 
                  onClick={toggleHistory} 
                  className={`text-sm font-medium px-2 py-1 rounded ${showHistory ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  History
                </button>
                <button 
                  onClick={toggleGraph} 
                  className={`text-sm font-medium px-2 py-1 rounded ${showGraph ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                >
                  Graph
                </button>
              </div>
              {showHistory && history.length > 0 && (
                <button 
                  onClick={clearHistory} 
                  className="text-sm text-red-500 font-medium"
                >
                  Clear History
                </button>
              )}
              {showGraph && (
                <button 
                  onClick={updateGraphFunction} 
                  className="text-sm text-green-600 font-medium"
                >
                  Plot Current
                </button>
              )}
            </div>
            
            {/* History Panel */}
            {showHistory && (
              <div className="max-h-64 overflow-y-auto bg-gray-50 p-2">
                {history.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-2">No calculation history</div>
                ) : (
                  <ul className="space-y-1">
                    {history.map((item, index) => (
                      <li key={index} className="text-sm text-gray-700 border-b border-gray-100 pb-1">{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            
            {/* Graph Panel */}
            {showGraph && (
              <div className="p-2 bg-white">
                <div className="mb-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <label className="text-sm font-medium text-gray-700">Function:</label>
                    <input 
                      type="text" 
                      value={graphFunction} 
                      onChange={(e) => setGraphFunction(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <button 
                      onClick={generateGraphData} 
                      className="bg-blue-500 text-white text-sm rounded px-2 py-1"
                    >
                      Plot
                    </button>
                  </div>
                  
                  <div className="flex space-x-2 text-sm mb-2">
                    <div className="flex items-center">
                      <label className="mr-1 text-gray-700">X Min:</label>
                      <input 
                        type="number" 
                        value={graphRange.min} 
                        onChange={(e) => updateGraphRange('min', e.target.value)}
                        className="w-16 border border-gray-300 rounded px-1 py-1"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="mr-1 text-gray-700">X Max:</label>
                      <input 
                        type="number" 
                        value={graphRange.max} 
                        onChange={(e) => updateGraphRange('max', e.target.value)}
                        className="w-16 border border-gray-300 rounded px-1 py-1"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="mr-1 text-gray-700">Points:</label>
                      <input 
                        type="number" 
                        value={graphRange.points} 
                        min="10" 
                        max="500"
                        onChange={(e) => updateGraphRange('points', e.target.value)}
                        className="w-16 border border-gray-300 rounded px-1 py-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="h-64 mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={graphData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="x" 
                        type="number" 
                        domain={[graphRange.min, graphRange.max]}
                        label={{ value: 'x', position: 'insideBottomRight', offset: -5 }}
                      />
                      <YAxis 
                        label={{ value: 'y', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value) => [value, 'y']}
                        labelFormatter={(label) => `x = ${label}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="y" 
                        stroke="#8884d8" 
                        name={graphFunction} 
                        dot={false} 
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="text-xs text-gray-500">
                  <p>Tips: Use 'x' as the variable. Try functions like 'sin(x)', 'x^2', 'log(x)', etc.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}