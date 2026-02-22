declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function pushEvent(event: string, params?: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

export const analytics = {
  trackSpin: (result: string, isAuthenticated: boolean) => {
    pushEvent('spin_wheel', { spin_result: result, is_authenticated: isAuthenticated });
  },
  trackGeneration: (lotteryType: string, method: string, tier: string) => {
    pushEvent('number_generation', { lottery_type: lotteryType, generation_method: method, user_tier: tier });
  },
  trackSubscriptionView: (tier: string) => {
    pushEvent('subscription_view', { viewed_tier: tier });
  },
  trackSubscriptionClick: (tier: string, paymentMethod: string) => {
    pushEvent('subscription_click', { selected_tier: tier, payment_method: paymentMethod });
  },
  trackReferralShare: (platform: string) => {
    pushEvent('referral_share', { share_platform: platform });
  },
  trackPoolJoin: (poolId: string) => {
    pushEvent('pool_join', { pool_id: poolId });
  },
  trackPageView: (pagePath: string, pageTitle: string) => {
    pushEvent('virtual_page_view', { page_path: pagePath, page_title: pageTitle });
  },
  trackMusicPlay: (songTitle: string) => {
    pushEvent('music_play', { song_title: songTitle });
  },
};
