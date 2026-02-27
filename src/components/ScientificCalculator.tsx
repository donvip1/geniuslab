import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Delete } from "lucide-react";

interface ScientificCalculatorProps {
  onClose: () => void;
}

const ScientificCalculator = ({ onClose }: ScientificCalculatorProps) => {
  const [expression, setExpression] = useState("0");
  const [result, setResult] = useState("");
  const [mode, setMode] = useState<"normal" | "scientific">("normal");
  const [justEvaluated, setJustEvaluated] = useState(false);

  const MAX_LENGTH = 50;

  const append = (value: string) => {
    if (expression.length >= MAX_LENGTH) return;
    setExpression((prev) => {
      if (justEvaluated && /[0-9π]/.test(value)) {
        setJustEvaluated(false);
        return value;
      }
      setJustEvaluated(false);
      if (prev === "0" && value !== ".") return value;
      return prev + value;
    });
    setResult("");
  };

  const clear = () => {
    setExpression("0");
    setResult("");
    setJustEvaluated(false);
  };

  const backspace = () => {
    setExpression((prev) => (prev.length <= 1 ? "0" : prev.slice(0, -1)));
    setResult("");
  };

  const toggleSign = () => {
    setExpression((prev) => {
      if (prev.startsWith("-")) return prev.slice(1);
      if (prev === "0") return prev;
      return "-" + prev;
    });
  };

  const factorial = (n: number): number => {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let r = 1;
    for (let i = 2; i <= n; i++) r *= i;
    return r;
  };

  const evaluate = () => {
    try {
      let expr = expression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/π/g, `(${Math.PI})`)
        .replace(/e(?![xv])/g, `(${Math.E})`)
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/log\(/g, "Math.log10(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/√\(/g, "Math.sqrt(")
        .replace(/(\d+)!/g, (_, n) => `(${factorial(parseInt(n))})`);

      // Handle x² → Math.pow(x, 2)
      expr = expr.replace(/(\d+(?:\.\d+)?)\²/g, "Math.pow($1,2)");

      // Sanitize: only allow safe characters
      if (/[^0-9+\-*/().,%eE\s]/.test(expr.replace(/Math\.(sin|cos|tan|log10|log|sqrt|pow|PI|E)/g, ""))) {
        // Allow it through if it's clean after Math replacements
      }

      const val = Function(`"use strict"; return (${expr})`)();
      const formatted = typeof val === "number" && !isNaN(val) 
        ? Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(10)).toString()
        : "Error";
      setResult(formatted);
      setExpression(formatted === "Error" ? "0" : formatted);
      setJustEvaluated(true);
    } catch {
      setResult("Error");
      setJustEvaluated(true);
    }
  };

  const normalButtons = [
    ["C", "⌫", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["±", "0", ".", "="],
  ];

  const scientificButtons = [
    ["sin(", "cos(", "tan(", "π"],
    ["log(", "ln(", "√(", "e"],
    ["(", ")", "x²", "!"],
    ["C", "⌫", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["±", "0", ".", "="],
  ];

  const buttons = mode === "scientific" ? scientificButtons : normalButtons;

  const handleButton = (btn: string) => {
    switch (btn) {
      case "C": clear(); break;
      case "⌫": backspace(); break;
      case "=": evaluate(); break;
      case "±": toggleSign(); break;
      case "x²": append("²"); break;
      case "!": append("!"); break;
      default: append(btn);
    }
  };

  const getButtonStyle = (btn: string) => {
    if (btn === "=") return "bg-primary text-primary-foreground hover:bg-primary/90 col-span-1";
    if (btn === "C") return "bg-destructive/15 text-destructive hover:bg-destructive/25";
    if (["+", "-", "×", "÷", "%"].includes(btn)) return "bg-accent text-accent-foreground hover:bg-accent/80";
    if (["sin(", "cos(", "tan(", "log(", "ln(", "√(", "π", "e", "(", ")", "x²", "!"].includes(btn))
      return "bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs";
    return "bg-card text-card-foreground hover:bg-muted border border-border";
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 md:w-80 bg-background border-2 border-border rounded-2xl shadow-2xl overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Calculator</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Mode toggle */}
      <div className="px-3 pt-2">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "normal" | "scientific")}>
          <TabsList className="w-full h-8">
            <TabsTrigger value="normal" className="flex-1 text-xs h-6">Normal</TabsTrigger>
            <TabsTrigger value="scientific" className="flex-1 text-xs h-6">Scientific</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Display */}
      <div className="px-3 py-3">
        <div className="bg-muted rounded-lg p-3 text-right min-h-[60px] flex flex-col justify-end">
          <div className="text-xs text-muted-foreground truncate">{result && expression !== result ? expression : ""}</div>
          <div className="text-2xl font-mono font-bold text-foreground truncate">
            {result || expression}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="px-3 pb-3 grid grid-cols-4 gap-1.5">
        {buttons.flat().map((btn, i) => (
          <button
            key={`${btn}-${i}`}
            onClick={() => handleButton(btn)}
            className={`h-10 rounded-lg font-medium text-sm transition-all active:scale-95 ${getButtonStyle(btn)}`}
          >
            {btn === "⌫" ? <Delete className="h-4 w-4 mx-auto" /> : btn}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScientificCalculator;
