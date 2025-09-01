import React from 'react';

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
}

export default function YouTubeEmbed({ videoId, title = "YouTube Video" }: YouTubeEmbedProps) {
  return (
    <div className="my-4">
      <div className="relative w-full pb-[56.25%] h-0 overflow-hidden rounded-lg shadow-lg">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          className="absolute top-0 left-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
