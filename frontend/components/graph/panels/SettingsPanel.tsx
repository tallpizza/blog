'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useGraphSettings } from '@/components/providers/GraphSettingsProvider';
import { DEFAULT_GRAPH_SETTINGS } from '@/lib/api-client';

interface SliderSettingProps {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

function SliderSetting({ label, description, value, min, max, step = 1, onChange }: SliderSettingProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400 font-mono">{value}</span>
      </div>
      <div className="text-xs text-gray-500 leading-snug">{description}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}

export function SettingsPanel() {
  const { settings, updateSettings, loading } = useGraphSettings();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSettingChange = useCallback(
    (key: keyof typeof settings) => (value: number) => {
      updateSettings({ [key]: value });
    },
    [updateSettings]
  );

  const handleReset = useCallback(() => {
    updateSettings(DEFAULT_GRAPH_SETTINGS);
  }, [updateSettings]);

  if (loading) return null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${
          isOpen 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
        }`}
        title="그래프 설정"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {isOpen && (
          <div
            ref={panelRef}
            className="absolute right-0 top-full mt-2 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50"
          >
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">그래프 설정</h3>
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  초기화
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <SliderSetting
                label="노드 크기"
                description="노드 반지름(px)"
                value={settings.nodeRadius}
                min={10}
                max={50}
                onChange={handleSettingChange('nodeRadius')}
              />

              <SliderSetting
                label="노드 반발력"
                description="노드끼리 밀어내는 힘(내부는 -값)"
                value={Math.abs(settings.chargeStrength)}
                min={0}
                max={1500}
                step={5}
                onChange={(v) => handleSettingChange('chargeStrength')(-v)}
              />

              <SliderSetting
                label="링크 거리"
                description="연결된 노드 목표 거리"
                value={settings.linkDistance}
                min={50}
                max={400}
                step={10}
                onChange={handleSettingChange('linkDistance')}
              />

              <SliderSetting
                label="중심으로 당김"
                description="중앙으로 모으는 힘"
                value={Math.round(settings.centerStrength * 100)}
                min={0}
                max={50}
                step={1}
                onChange={(v) => handleSettingChange('centerStrength')(v / 100)}
              />

              <SliderSetting
                label="링크 강도"
                description="연결 스프링 강도"
                value={settings.linkStrength * 100}
                min={10}
                max={200}
                step={10}
                onChange={(v) => handleSettingChange('linkStrength')(v / 100)}
              />

              <SliderSetting
                label="감쇠(마찰)"
                description="흔들림이 빨리 죽는 정도"
                value={settings.velocityDecay * 100}
                min={10}
                max={90}
                step={5}
                onChange={(v) => handleSettingChange('velocityDecay')(v / 100)}
              />

              <SliderSetting
                label="초기 줌 레벨"
                description="그래프 로드 시 적용되는 줌 배율"
                value={Math.round(settings.initialZoom * 10) / 10}
                min={0.1}
                max={5}
                step={0.1}
                onChange={handleSettingChange('initialZoom')}
              />
            </div>

            <div className="px-4 pb-4">
              <p className="text-xs text-gray-500">
                변경 사항은 즉시 적용되며 자동 저장됩니다.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
