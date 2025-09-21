import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import YouTubeEmbed from './YouTubeEmbed';

interface CustomMarkdownProps {
  content: string;
}

export default function CustomMarkdown({ content }: CustomMarkdownProps) {
  // Split content by YouTube embed markers
  const parts = content.split(/(\[YOUTUBE_EMBED:[^\]]+\])/g);
  
  return (
    <div>
      {parts.map((part, index) => {
        // Check if this part is a YouTube embed marker
        const embedMatch = part.match(/\[YOUTUBE_EMBED:([^\]]+)\]/);
        
        if (embedMatch) {
          const videoId = embedMatch[1];
          return <YouTubeEmbed key={index} videoId={videoId} />;
        }
        
        // Regular markdown content with LaTeX math support
        if (part.trim()) {
          return (
            <ReactMarkdown 
              key={index}
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {part}
            </ReactMarkdown>
          );
        }
        
        return null;
      })}
    </div>
  );
}
