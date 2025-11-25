'use client';

interface ServerBannerProps {
  imageUrl?: string;
  serverName: string;
  position?: number; // 0-100, posição vertical (default: 50)
}

export function ServerBanner({ imageUrl, serverName, position = 50 }: ServerBannerProps) {
  if (!imageUrl) {
    return (
      <div className="w-full h-64 bg-gradient-to-r from-blue-500 to-purple-600 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            {serverName}
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-64 relative overflow-hidden">
      <img
        src={imageUrl}
        alt={`${serverName} banner`}
        className="w-full h-full object-cover"
        style={{ objectPosition: `center ${position}%` }}
      />
    </div>
  );
}
