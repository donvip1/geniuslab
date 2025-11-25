import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ExpandableTextProps {
  text: string;
  maxWords?: number;
}

export const ExpandableText = ({ text, maxWords = 150 }: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const words = text.split(' ');
  const shouldTruncate = words.length > maxWords;
  
  if (!shouldTruncate) {
    return <p className="leading-relaxed">{text}</p>;
  }
  
  const displayText = isExpanded 
    ? text 
    : words.slice(0, maxWords).join(' ') + '...';
  
  return (
    <div>
      <p className="leading-relaxed whitespace-pre-line">{displayText}</p>
      <Button
        variant="link"
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-0 h-auto font-semibold text-primary"
      >
        {isExpanded ? 'Show Less' : 'Show More'}
      </Button>
    </div>
  );
};
