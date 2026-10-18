import React from 'react';

interface HollandHexagonChartProps {
  riasec: {
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  };
  size?: number;
}

const DIMENSIONS = [
  { key: 'R', label: 'Realistický (R)', desc: 'Praktické technologie & hardware', color: '#0284c7' },
  { key: 'I', label: 'Investigativní (I)', desc: 'Analýza, bádání & algoritmy', color: '#2563eb' },
  { key: 'A', label: 'Umělecký (A)', desc: 'Design, kreativita & UX', color: '#7c3aed' },
  { key: 'S', label: 'Sociální (S)', desc: 'Komunikace, lidé & edukace', color: '#059669' },
  { key: 'E', label: 'Podnikavý (E)', desc: 'Iniciativa, vedení & dopad', color: '#d97706' },
  { key: 'C', label: 'Konvenční (C)', desc: 'Řád, data & preciznost', color: '#dc2626' },
] as const;

export const HollandHexagonChart: React.FC<HollandHexagonChartProps> = ({
  riasec,
  size = 340,
}) => {
  const center = size / 2;
  const radius = size * 0.36; // cca 122px při 340px
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Výpočet souřadnic pro daný úhel a vzdálenost od středu
  // Úhel začíná na -90° (nahoře = R) a pokračuje po 60° ve směru hodinových ručiček:
  // R (nahoře), I (vpravo nahoře), A (vpravo dole), S (dole), E (vlevo dole), C (vlevo nahoře)
  const getCoordinates = (index: number, value: number) => {
    const angleDeg = -90 + index * 60;
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: center + radius * value * Math.cos(angleRad),
      y: center + radius * value * Math.sin(angleRad),
    };
  };

  // Body polygonu studenta
  const polygonPoints = DIMENSIONS.map((dim, idx) => {
    const val = Math.max(0.08, Math.min(1.0, (riasec as any)[dim.key] || 0.5));
    const { x, y } = getCoordinates(idx, val);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          {/* Mřížka soustředných šestiúhelníků */}
          {gridLevels.map((lvl) => {
            const levelPoints = DIMENSIONS.map((_, idx) => {
              const { x, y } = getCoordinates(idx, lvl);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');

            return (
              <polygon
                key={lvl}
                points={levelPoints}
                fill={lvl === 1.0 ? '#f8fafc' : 'none'}
                stroke="#e2e8f0"
                strokeWidth={lvl === 1.0 ? 1.5 : 1}
                strokeDasharray={lvl === 1.0 ? undefined : '3 3'}
              />
            );
          })}

          {/* Osy spojující střed s vrcholy */}
          {DIMENSIONS.map((_, idx) => {
            const { x, y } = getCoordinates(idx, 1.0);
            return (
              <line
                key={idx}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="#cbd5e1"
                strokeWidth={1}
              />
            );
          })}

          {/* Plocha studentova profilu */}
          <polygon
            points={polygonPoints}
            fill="rgba(0, 102, 179, 0.22)"
            stroke="#0066b3"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* Vrcholové body a hodnoty */}
          {DIMENSIONS.map((dim, idx) => {
            const val = Math.max(0.08, Math.min(1.0, (riasec as any)[dim.key] || 0.5));
            const pt = getCoordinates(idx, val);
            const outerPt = getCoordinates(idx, 1.22);
            const pct = Math.round(val * 100);

            // Doladění pozice popisku
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            let dy = '0.35em';
            if (idx === 1 || idx === 2) textAnchor = 'start';
            if (idx === 4 || idx === 5) textAnchor = 'end';
            if (idx === 0) dy = '-0.6em';
            if (idx === 3) dy = '1.2em';

            return (
              <g key={dim.key}>
                {/* Bod na vrcholu polygonu */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={4.5}
                  fill="#ffffff"
                  stroke="#0066b3"
                  strokeWidth={2.5}
                  className="transition-all duration-300"
                />

                {/* Popisek vrcholu */}
                <text
                  x={outerPt.x}
                  y={outerPt.y}
                  textAnchor={textAnchor}
                  dy={dy}
                  className="text-[11px] font-bold fill-slate-700"
                >
                  <tspan className="fill-ou-blue font-extrabold">{dim.key}</tspan>
                  {' '}
                  <tspan className="fill-slate-500 font-normal">({pct} %)</tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Rychlá vysvětlivka vrcholů pod grafem */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-1 mt-2 text-[10.5px] text-slate-500 text-center max-w-xs">
        <div><strong className="text-slate-700">R:</strong> Praktický</div>
        <div><strong className="text-slate-700">I:</strong> Analytický</div>
        <div><strong className="text-slate-700">A:</strong> Tvořivý</div>
        <div><strong className="text-slate-700">S:</strong> Sociální</div>
        <div><strong className="text-slate-700">E:</strong> Podnikavý</div>
        <div><strong className="text-slate-700">C:</strong> Systémový</div>
      </div>
    </div>
  );
};
