import { LiveMatchBannerData } from '@/contexts/LiveMatchBannerContext';

type BannerCallback = (data: LiveMatchBannerData) => void;

let _callback: BannerCallback | null = null;

export const liveBannerBridge = {
  register(callback: BannerCallback) {
    _callback = callback;
  },
  unregister() {
    _callback = null;
  },
  show(data: LiveMatchBannerData) {
    _callback?.(data);
  },
};
