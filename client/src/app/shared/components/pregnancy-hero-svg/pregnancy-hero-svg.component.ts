import { Component, Input } from '@angular/core';

/**
 * Soft, modern vector illustration for the pregnancy home hero.
 * Scales gently with gestational week when no week-specific raster is available.
 */
@Component({
  selector: 'app-pregnancy-hero-svg',
  standalone: true,
  template: `
    <svg
      class="pregnancy-hero-svg__art"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient [attr.id]="gradId + '-bg'" cx="42%" cy="34%" r="68%">
          <stop offset="0%" stop-color="#fff9f6" />
          <stop offset="48%" stop-color="#ffe8dc" />
          <stop offset="100%" stop-color="#f8c4b0" />
        </radialGradient>
        <linearGradient [attr.id]="gradId + '-ring'" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffcaba" />
          <stop offset="52%" stop-color="#f2a090" />
          <stop offset="100%" stop-color="#d86a52" />
        </linearGradient>
        <radialGradient [attr.id]="gradId + '-glow'" cx="50%" cy="58%" r="50%">
          <stop offset="0%" stop-color="#fff0e8" stop-opacity="0.95" />
          <stop offset="70%" stop-color="#ffd4c4" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#ffd4c4" stop-opacity="0" />
        </radialGradient>
        <linearGradient [attr.id]="gradId + '-baby'" x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stop-color="#ffece4" />
          <stop offset="45%" stop-color="#f5b8a8" />
          <stop offset="100%" stop-color="#e59882" />
        </linearGradient>
        <filter [attr.id]="gradId + '-soft'" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="100" cy="100" r="92" [attr.fill]="'url(#' + gradId + '-bg)'" />
      <circle
        cx="100"
        cy="100"
        r="88"
        fill="none"
        [attr.stroke]="'url(#' + gradId + '-ring)'"
        stroke-width="2.5"
        opacity="0.55"
      />
      <circle cx="100" cy="108" r="62" [attr.fill]="'url(#' + gradId + '-glow)'" />

      <g [attr.transform]="babyTransform()">
        <g
          class="pregnancy-hero-svg__baby"
          [attr.filter]="'url(#' + gradId + '-soft)'"
        >
        <ellipse cx="100" cy="118" rx="34" ry="40" fill="rgba(255, 255, 255, 0.22)" />
        <path
          d="M78 126 C72 108 84 92 100 88 C118 84 132 98 128 118 C124 136 108 146 96 142 C86 138 80 134 78 126 Z"
          [attr.fill]="'url(#' + gradId + '-baby)'"
          opacity="0.96"
        />
        <circle cx="112" cy="102" r="13.5" [attr.fill]="'url(#' + gradId + '-baby)'" />
        <path
          d="M104 98 C108 94 116 95 118 100 C116 104 110 106 106 103 Z"
          fill="rgba(255, 255, 255, 0.35)"
        />
        <path
          d="M88 120 C82 128 78 134 86 138"
          fill="none"
          stroke="#e8a090"
          stroke-width="3.2"
          stroke-linecap="round"
          opacity="0.7"
        />
        <path
          d="M118 122 C126 130 130 136 122 140"
          fill="none"
          stroke="#e8a090"
          stroke-width="3"
          stroke-linecap="round"
          opacity="0.65"
        />
        </g>
      </g>

      <g class="pregnancy-hero-svg__sparkles" opacity="0.75">
        <circle cx="52" cy="62" r="2.2" fill="#fff" opacity="0.8" />
        <circle cx="148" cy="74" r="1.8" fill="#fff" opacity="0.65" />
        <circle cx="156" cy="132" r="2.4" fill="#fff" opacity="0.55" />
        <circle cx="44" cy="128" r="1.6" fill="#fff" opacity="0.5" />
      </g>

      <path
        d="M62 154 C78 168 122 168 138 154"
        fill="none"
        stroke="rgba(255, 255, 255, 0.55)"
        stroke-width="2"
        stroke-linecap="round"
        opacity="0.7"
      />
    </svg>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .pregnancy-hero-svg__art {
        display: block;
        width: 100%;
        height: 100%;
      }

      .pregnancy-hero-svg__baby {
        transform-origin: 100px 112px;
        animation: pregnancy-hero-svg-breathe 4.2s ease-in-out infinite;
      }

      .pregnancy-hero-svg__sparkles {
        animation: pregnancy-hero-svg-sparkle 5.5s ease-in-out infinite;
      }

      @keyframes pregnancy-hero-svg-breathe {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.03);
        }
      }

      @keyframes pregnancy-hero-svg-sparkle {
        0%,
        100% {
          opacity: 0.55;
        }
        50% {
          opacity: 0.9;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .pregnancy-hero-svg__baby,
        .pregnancy-hero-svg__sparkles {
          animation: none;
        }
      }

      :host-context(html.ion-palette-dark) .pregnancy-hero-svg__art {
        filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.28));
      }
    `,
  ],
  host: {
    class: 'pregnancy-hero-svg',
  },
})
export class PregnancyHeroSvgComponent {
  @Input() week = 1;

  readonly gradId = `phs-${Math.random().toString(36).slice(2, 9)}`;

  babyTransform(): string {
    const w = Math.min(40, Math.max(4, Math.round(Number(this.week) || 1)));
    const s = 0.34 + ((w - 4) * 0.5) / 36;
    return `translate(100 112) scale(${s}) translate(-100 -112)`;
  }
}
