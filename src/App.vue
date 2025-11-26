<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import type { ComponentPublicInstance } from 'vue';

type Tile = {
  header: string;
  planName: string;
  price: string;
  description: string;
  ctaLabel: string;
  icon: string;
  shellStart: string;
  shellEnd?: string;
  cardBg?: string;
  cardText?: string;
  iconBg?: string;
  iconColor?: string;
  ctaBg?: string;
  ctaColor?: string;
  dotColor?: string;
  activeDot?: number;
};

type Category = {
  id: string;
  title: string;
  blurb: string;
  tiles: Tile[];
};

const loopMultiplier = 3;

const baseCategories: Category[] = [
  {
    id: 'platform',
    title: 'Trading platform',
    blurb: 'Customize every stage of your trade flow.',
    tiles: [
      {
        header: 'Choose your plan',
        planName: 'Zero-lag Kit',
        price: '$32.00',
        description: 'Routing tuned for milliseconds.',
        ctaLabel: 'Get now',
        icon: '⚡️',
        shellStart: '#6F4BFF',
        shellEnd: '#8C6CFF',
        cardBg: '#ffffff',
        cardText: '#1b1b2a',
        iconBg: '#F2EAFF',
        iconColor: '#6F4BFF',
        ctaBg: '#140036',
        ctaColor: '#F5EDFF',
        dotColor: '#F5EDFF',
        activeDot: 2
      },
      {
        header: 'Layout studio',
        planName: 'Workspace Flow',
        price: '$24.00',
        description: 'Snap together charts and ladders.',
        ctaLabel: 'Start free',
        icon: '🧩',
        shellStart: '#FF7FD1',
        shellEnd: '#FF9A9E',
        cardBg: '#FFFFFF',
        cardText: '#24121B',
        iconBg: '#FFE5F6',
        iconColor: '#D73FA0',
        ctaBg: '#2F0A2C',
        ctaColor: '#FFE5F6',
        dotColor: '#FFE5F6',
        activeDot: 3
      },
      {
        header: 'Strategy blocks',
        planName: 'Playbook Pro',
        price: '$41.00',
        description: 'Drag & drop order logic.',
        ctaLabel: 'Unlock',
        icon: '🎯',
        shellStart: '#FFB657',
        shellEnd: '#FF8F4B',
        cardBg: '#FFF6EB',
        cardText: '#402000',
        iconBg: '#FFE4C4',
        iconColor: '#FF7A00',
        ctaBg: '#3A1C00',
        ctaColor: '#FFE4C4',
        dotColor: '#FFE4C4',
        activeDot: 1
      },
      {
        header: 'Video desk',
        planName: 'Live Analyst',
        price: '$55.00',
        description: 'Live analyst walkthroughs.',
        ctaLabel: 'Book slot',
        icon: '📹',
        shellStart: '#FF6A88',
        shellEnd: '#FF99AC',
        cardBg: '#FFF',
        cardText: '#331118',
        iconBg: '#FFE0E7',
        iconColor: '#FF3E63',
        ctaBg: '#3B0A18',
        ctaColor: '#FFE0E7',
        dotColor: '#FFE0E7',
        activeDot: 2
      },
      {
        header: 'Service tiers',
        planName: 'Priority Care',
        price: '$18.00',
        description: 'Pick the response time you need.',
        ctaLabel: 'Upgrade',
        icon: '💬',
        shellStart: '#34E89E',
        shellEnd: '#0F3443',
        cardBg: '#F3FFF8',
        cardText: '#042318',
        iconBg: '#D9FFEC',
        iconColor: '#11704B',
        ctaBg: '#05241A',
        ctaColor: '#D9FFEC',
        dotColor: '#D9FFEC',
        activeDot: 1
      }
    ]
  },
  {
    id: 'education',
    title: 'Education & guidance',
    blurb: 'Level up your skills with curated paths.',
    tiles: [
      {
        header: 'Jumpstart',
        planName: 'Bootcamp Week',
        price: '$12.00',
        description: 'Interactive 7-day onboarding.',
        ctaLabel: 'Enroll',
        icon: '🎓',
        shellStart: '#FFD580',
        shellEnd: '#FFAF5F',
        cardBg: '#FFF',
        cardText: '#4A2B00',
        iconBg: '#FFF0CF',
        iconColor: '#C87000',
        ctaBg: '#4A2B00',
        ctaColor: '#FFE8BE',
        dotColor: '#FFE8BE',
        activeDot: 1
      },
      {
        header: 'Office hours',
        planName: 'Coach Circle',
        price: '$28.00',
        description: 'Weekly AMAs with coaches.',
        ctaLabel: 'Join live',
        icon: '💬',
        shellStart: '#4DD1FF',
        shellEnd: '#5697FF',
        cardBg: '#FFFFFF',
        cardText: '#022C41',
        iconBg: '#D7F4FF',
        iconColor: '#0A6E9F',
        ctaBg: '#022C41',
        ctaColor: '#D7F4FF',
        dotColor: '#D7F4FF',
        activeDot: 2
      },
      {
        header: 'Playbooks',
        planName: 'Scenario Deck',
        price: '$19.00',
        description: 'Scenario-based checklists.',
        ctaLabel: 'Preview',
        icon: '📋',
        shellStart: '#FF9EB2',
        shellEnd: '#FF6F91',
        cardBg: '#FFF',
        cardText: '#3A0E18',
        iconBg: '#FFE0E9',
        iconColor: '#C82A57',
        ctaBg: '#40101F',
        ctaColor: '#FFE0E9',
        dotColor: '#FFE0E9',
        activeDot: 3
      },
      {
        header: 'Signal alerts',
        planName: 'Alpha Radar',
        price: '$42.00',
        description: 'Push-ready trade triggers.',
        ctaLabel: 'Arm now',
        icon: '🚨',
        shellStart: '#B8F28E',
        shellEnd: '#7BD77B',
        cardBg: '#F7FFED',
        cardText: '#1F3B07',
        iconBg: '#E4FFC7',
        iconColor: '#417908',
        ctaBg: '#1F3B07',
        ctaColor: '#E4FFC7',
        dotColor: '#E4FFC7',
        activeDot: 2
      },
      {
        header: 'Community lab',
        planName: 'Builder Pods',
        price: '$16.00',
        description: 'Share templates & get feedback.',
        ctaLabel: 'Open lab',
        icon: '🧪',
        shellStart: '#A3A2FF',
        shellEnd: '#7370FF',
        cardBg: '#F6F6FF',
        cardText: '#1F1B52',
        iconBg: '#E2E1FF',
        iconColor: '#4435FF',
        ctaBg: '#1F1B52',
        ctaColor: '#E2E1FF',
        dotColor: '#E2E1FF',
        activeDot: 1
      }
    ]
  },
  {
    id: 'assets',
    title: 'Asset access',
    blurb: 'Step into global markets instantly.',
    tiles: [
      {
        header: 'Top assets',
        planName: 'Global Equities',
        price: '$65.00',
        description: 'US, EU & APAC coverage.',
        ctaLabel: 'Queue trade',
        icon: '🌐',
        shellStart: '#BC8CFF',
        shellEnd: '#7B5BFF',
        cardBg: '#F9F5FF',
        cardText: '#2B0F52',
        iconBg: '#E9DAFF',
        iconColor: '#6230FF',
        ctaBg: '#2B0F52',
        ctaColor: '#E9DAFF',
        dotColor: '#E9DAFF',
        activeDot: 3
      },
      {
        header: 'Smart baskets',
        planName: 'ETF Stack',
        price: '$22.00',
        description: 'Smart basket exposure.',
        ctaLabel: 'Stack now',
        icon: '📈',
        shellStart: '#66E5D9',
        shellEnd: '#35C6C0',
        cardBg: '#F4FFFD',
        cardText: '#063733',
        iconBg: '#D5FFFA',
        iconColor: '#0B5F59',
        ctaBg: '#063733',
        ctaColor: '#D5FFFA',
        dotColor: '#D5FFFA',
        activeDot: 2
      },
      {
        header: 'Digital assets',
        planName: 'Crypto Desk',
        price: '$38.00',
        description: '24/7 regulated crypto desk.',
        ctaLabel: 'Mint access',
        icon: '🪙',
        shellStart: '#FFB7A1',
        shellEnd: '#FF8BA0',
        cardBg: '#FFF6F3',
        cardText: '#47190E',
        iconBg: '#FFE0D6',
        iconColor: '#C44C2C',
        ctaBg: '#47190E',
        ctaColor: '#FFE0D6',
        dotColor: '#FFE0D6',
        activeDot: 1
      },
      {
        header: 'Hedge layer',
        planName: 'Commodities Mix',
        price: '$27.00',
        description: 'Energy, metals, softs.',
        ctaLabel: 'Secure load',
        icon: '⛏️',
        shellStart: '#85F58F',
        shellEnd: '#4BC982',
        cardBg: '#EEFFF1',
        cardText: '#103612',
        iconBg: '#D4FFE0',
        iconColor: '#1E7A37',
        ctaBg: '#103612',
        ctaColor: '#D4FFE0',
        dotColor: '#D4FFE0',
        activeDot: 2
      },
      {
        header: 'Yield lane',
        planName: 'Fixed Income',
        price: '$31.00',
        description: 'Sovereign to high-yield.',
        ctaLabel: 'Lend now',
        icon: '💹',
        shellStart: '#FFD2E6',
        shellEnd: '#FF9CC7',
        cardBg: '#FFF5FA',
        cardText: '#42041E',
        iconBg: '#FFE1F1',
        iconColor: '#B21662',
        ctaBg: '#42041E',
        ctaColor: '#FFE1F1',
        dotColor: '#FFE1F1',
        activeDot: 3
      }
    ]
  }
];

const categories = baseCategories.map((category) => {
  const looped = Array.from({ length: loopMultiplier }, (_, loopIndex) =>
    category.tiles.map((tile, tileIndex) => ({
      ...tile,
      loopKey: `${category.id}-${loopIndex}-${tileIndex}`
    }))
  ).flat();

  return {
    ...category,
    loopedTiles: looped
  };
});

const carouselRefs = ref<Record<string, HTMLElement | null>>({});

const isComponentInstance = (value: unknown): value is ComponentPublicInstance =>
  !!value && typeof value === 'object' && '$el' in (value as Record<string, unknown>);

const resolveElement = (
  target: Element | ComponentPublicInstance | null
): HTMLElement | null => {
  if (!target) return null;
  if (target instanceof HTMLElement) return target;
  if (isComponentInstance(target)) {
    return (target.$el as HTMLElement | null) ?? null;
  }
  return null;
};

const setCarouselRef = (id: string) => (el: Element | ComponentPublicInstance | null) => {
  carouselRefs.value[id] = resolveElement(el);
};

const initCarousel = (id: string) => {
  const el = carouselRefs.value[id];
  if (!el) return;
  const singleWidth = el.scrollWidth / loopMultiplier;
  el.scrollLeft = singleWidth;
};

const handleScroll = (id: string) => {
  const el = carouselRefs.value[id];
  if (!el) return;
  const singleWidth = el.scrollWidth / loopMultiplier;
  const lowerBound = singleWidth * 0.4;
  const upperBound = singleWidth * (loopMultiplier - 0.4);

  if (el.scrollLeft <= lowerBound) {
    el.scrollLeft += singleWidth;
  } else if (el.scrollLeft >= upperBound) {
    el.scrollLeft -= singleWidth;
  }
};

onMounted(() => {
  nextTick(() => {
    categories.forEach((category) => initCarousel(category.id));
  });
});
</script>

<template>
  <main class="page">
    <section class="hero">
      <div class="hero__text">
        <p class="eyebrow">The platform</p>
        <h1>Trading reinvented</h1>
        <p class="lede">
          Forget everything you know about trading tools. Experience instant clarity,
          bold visuals, and workflows that feel built just for you.
        </p>
      </div>
      <div class="hero__cta">
        <p>Ready for the next chapter?</p>
        <button>Let&apos;s go</button>
      </div>
    </section>

    <section class="categories">
      <div v-for="category in categories" :key="category.id" class="category">
        <header class="category__header">
          <p class="eyebrow">{{ category.id }}</p>
          <h2>{{ category.title }}</h2>
          <p>{{ category.blurb }}</p>
        </header>

        <div
          class="tiles"
          :ref="setCarouselRef(category.id)"
          @scroll.passive="handleScroll(category.id)"
        >
          <article
            v-for="tile in category.loopedTiles"
            :key="tile.loopKey"
            class="tile plan-card"
            :style="{
              '--shell-start': tile.shellStart,
              '--shell-end': tile.shellEnd || tile.shellStart,
              '--card-bg': tile.cardBg || '#ffffff',
              '--card-text': tile.cardText || '#0f0f1b',
              '--icon-bg': tile.iconBg || '#f5f5ff',
              '--icon-color': tile.iconColor || '#3a2cff',
              '--cta-bg': tile.ctaBg || '#140036',
              '--cta-color': tile.ctaColor || '#fefefe',
              '--dot-active': tile.dotColor || '#ffffff',
              '--dot-inactive': 'rgba(255,255,255,0.4)'
            }"
          >
            <div class="plan-shell">
              <header class="plan-header">
                <span>{{ tile.header }}</span>
                <button class="plan-close" aria-label="Close card">×</button>
              </header>

              <div class="plan-card__surface">
                <div class="plan-icon">
                  <span>{{ tile.icon }}</span>
                </div>
                <p class="plan-price">{{ tile.price }}</p>
                <p class="plan-name">{{ tile.planName }}</p>
                <p class="plan-description">{{ tile.description }}</p>
              </div>

              <div class="plan-dots" role="tablist" aria-label="Carousel position">
                <span
                  v-for="dot in 3"
                  :key="dot"
                  :class="['plan-dot', { 'plan-dot--active': dot === (tile.activeDot || 2) }]"
                ></span>
              </div>

              <button class="plan-cta">
                {{ tile.ctaLabel }}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="cta-block">
      <p class="eyebrow">Always on</p>
      <p class="cta-block__line">It just makes sense.</p>
      <p class="cta-block__line">Instantly. Intuitively. Always.</p>
    </section>
  </main>
</template>

<style scoped>
:global(:root) {
  --page-pad: clamp(1.5rem, 5vw, 6rem);
}

:global(body) {
  font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #05020f;
  color: #f5f5f7;
  margin: 0;
}

.page {
  min-height: 100vh;
  background: radial-gradient(circle at top left, #0f0624, #02000c);
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.hero {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2rem;
  background: #0b0820;
  border-radius: 2rem;
  padding: 3rem;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
}

.hero__text {
  max-width: 540px;
}

.hero h1 {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  margin: 0.4rem 0;
}

.hero .lede {
  color: #cfcfe1;
  font-size: 1.15rem;
  line-height: 1.6;
}

.hero__cta {
  background: linear-gradient(145deg, #4525ff, #7f3bf4);
  border-radius: 1.5rem;
  padding: 2rem;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.hero__cta button {
  background: #05020f;
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 0.9rem 1.8rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
}

.hero__cta button:hover {
  background: #140736;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.8rem;
  color: #8c85ff;
  margin: 0;
}

.categories {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.category {
  background: #070416;
  border-radius: 2rem;
  padding: 2rem 0 2.5rem;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  overflow: hidden;
}

.category__header {
  padding-inline: var(--page-pad);
}

.category__header h2 {
  margin: 0.2rem 0;
}

.category__header p {
  max-width: 480px;
  color: #c5c4dc;
}

.tiles {
  margin-top: 2rem;
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-left: var(--page-pad);
  scroll-padding-right: var(--page-pad);
  padding: 0 0 0.5rem;
  padding-inline: var(--page-pad);
  margin-inline: calc(-1 * var(--page-pad));
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tiles::-webkit-scrollbar {
  display: none;
}

.tile {
  flex: 0 0 clamp(240px, 22vw, 340px);
  scroll-snap-align: center;
  padding: 0;
}

.plan-shell {
  background: linear-gradient(140deg, var(--shell-start), var(--shell-end));
  border-radius: 2.2rem;
  padding: 1.4rem;
  min-height: 430px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.plan-card:hover .plan-shell {
  transform: translateY(-10px);
  box-shadow: 0 40px 70px rgba(0, 0, 0, 0.55), inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: rgba(255, 255, 255, 0.92);
  font-weight: 600;
  font-size: 0.95rem;
}

.plan-close {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  font-size: 1.1rem;
  cursor: pointer;
}

.plan-card__surface {
  background: var(--card-bg);
  color: var(--card-text);
  border-radius: 1.8rem;
  padding: 1.6rem 1.4rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.15);
}

.plan-icon {
  width: 70px;
  height: 70px;
  border-radius: 1.4rem;
  background: var(--icon-bg);
  color: var(--icon-color);
  display: grid;
  place-items: center;
  font-size: 2rem;
  margin: 0 auto 0.5rem;
}

.plan-price {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.plan-name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.plan-description {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.8;
  line-height: 1.4;
}

.plan-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.plan-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--dot-inactive);
  transition: transform 0.2s ease, background 0.2s ease;
}

.plan-dot--active {
  background: var(--dot-active);
  transform: scale(1.2);
}

.plan-cta {
  border: none;
  border-radius: 999px;
  padding: 0.85rem 1.6rem;
  background: var(--cta-bg);
  color: var(--cta-color);
  font-weight: 600;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  cursor: pointer;
  align-self: flex-start;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35);
}

.plan-cta span {
  font-size: 1.2rem;
}

.cta-block {
  text-align: center;
  padding: 4rem 1rem;
  border-radius: 2rem;
  background: linear-gradient(145deg, #0c081f, #130a2c);
  box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
}

.cta-block__line {
  font-size: clamp(1.8rem, 4vw, 3rem);
  margin: 0.4rem 0;
}

@media (max-width: 720px) {
  .hero {
    padding: 2rem;
  }

  .hero__cta {
    width: 100%;
  }

  .category {
    padding: 1.5rem;
  }

  .tiles {
    gap: 1rem;
    padding: 0 1.5rem 0.5rem;
  }

  .tile {
    flex: 0 0 80vw;
    margin: 0 auto;
  }

  .plan-shell {
    min-height: 360px;
    padding: 1.1rem;
  }

  .plan-card__surface {
    padding: 1.4rem 1.1rem;
  }
}
</style>
