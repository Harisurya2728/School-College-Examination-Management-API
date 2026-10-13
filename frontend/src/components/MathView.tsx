import React, { useMemo } from 'react';
import katex from 'katex';

interface MathViewProps {
  latex?: string;
  block?: boolean;
  className?: string;
}

export const MathView: React.FC<MathViewProps> = ({ latex, block = false, className = '' }) => {
  const renderedHtml = useMemo(() => {
    if (!latex) return '';
    try {
      return katex.renderToString(latex, {
        displayMode: block,
        throwOnError: false,
      });
    } catch {
      return latex;
    }
  }, [latex, block]);

  if (!latex) return null;

  return (
    <span
      className={`katex-math-render ${block ? 'katex-block' : 'katex-inline'} ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
