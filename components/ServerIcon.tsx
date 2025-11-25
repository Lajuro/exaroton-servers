'use client';

import { Server } from 'lucide-react';

interface ServerIconProps {
  iconUrl?: string;
  serverName: string;
  size?: number;
}

export function ServerIcon({ iconUrl, serverName, size = 64 }: ServerIconProps) {
  if (!iconUrl) {
    return (
      <div 
        className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Server className="text-white" size={size * 0.5} />
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ width: size, height: size }}>
      <img
        src={iconUrl}
        alt={`${serverName} icon`}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
