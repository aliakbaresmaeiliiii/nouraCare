import { Component, Input } from '@angular/core';

type PregnancyHeroStage = 'early' | 'mid' | 'late';

/**
 * Modern pregnancy hero illustration — abstract orbital rings, soft mesh glow,
 * minimal flat baby silhouette that scales by gestational week.
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
        <radialGradient [attr.id]="gradId + '-mesh'" cx="50%" cy="44%" r="58%">
          <stop offset="0%" stop-color="#fff" stop-opacity="0.95" />
          <stop offset="42%" stop-color="#fce7f3" stop-opacity="0.72" />
          <stop offset="100%" stop-color="#e9d5ff" stop-opacity="0.18" />
        </radialGradient>
        <linearGradient [attr.id]="gradId + '-arc'" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f472b6" />
          <stop offset="100%" stop-color="#a78bfa" />
        </linearGradient>
        <linearGradient [attr.id]="gradId + '-baby'" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stop-color="#fecdd3" />
          <stop offset="55%" stop-color="#fb7185" />
          <stop offset="100%" stop-color="#f43f5e" />
        </linearGradient>
        <filter [attr.id]="gradId + '-blur'" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
      </defs>

      <circle cx="100" cy="100" r="78" [attr.fill]="'url(#' + gradId + '-mesh)'" />

      <circle
        class="pregnancy-hero-svg__orb pregnancy-hero-svg__orb--a"
        cx="126"
        cy="72"
        r="28"
        fill="#fbcfe8"
        opacity="0.55"
        [attr.filter]="'url(#' + gradId + '-blur)'"
      />
      <circle
        class="pregnancy-hero-svg__orb pregnancy-hero-svg__orb--b"
        cx="72"
        cy="118"
        r="24"
        fill="#ddd6fe"
        opacity="0.5"
        [attr.filter]="'url(#' + gradId + '-blur)'"
      />

      <g
        class="pregnancy-hero-svg__arcs"
        fill="none"
        [attr.stroke]="'url(#' + gradId + '-arc)'"
        stroke-linecap="round"
      >
        <circle cx="100" cy="100" r="68" stroke-width="1.4" opacity="0.22" />
        <path
          d="M100 36 A64 64 0 0 1 164 100"
          stroke-width="2.2"
          opacity="0.42"
        />
        <path
          d="M164 100 A64 64 0 0 1 100 164"
          stroke-width="1.8"
          opacity="0.28"
        />
        <path
          d="M100 164 A64 64 0 0 1 36 100"
          stroke-width="1.4"
          opacity="0.18"
        />
      </g>

      <g [attr.transform]="babyTransform()">
        @if (stage() === 'early') {
        <g class="pregnancy-hero-svg__baby">
          <circle cx="100" cy="102" r="14" [attr.fill]="'url(#' + gradId + '-baby)'" />
          <circle cx="106" cy="97" r="4.5" fill="#fff" opacity="0.45" />
        </g>
        } @else if (stage() === 'mid') {
        <g class="pregnancy-hero-svg__baby">
          <ellipse cx="100" cy="108" rx="22" ry="26" [attr.fill]="'url(#' + gradId + '-baby)'" />
          <circle cx="112" cy="94" r="11" [attr.fill]="'url(#' + gradId + '-baby)'" />
          <path
            d="M116 92 C119 93 121 96 119 97"
            stroke="#fff"
            stroke-width="1.2"
            stroke-linecap="round"
            opacity="0.55"
            fill="none"
          />
        </g>
        } @else {
        <g class="pregnancy-hero-svg__baby">
          <path
            d="M86 118 C80 102 90 84 104 78 C118 72 132 80 136 96 C140 112 130 128 114 134 C100 139 88 132 86 118 Z"
            [attr.fill]="'url(#' + gradId + '-baby)'"
          />
          <ellipse cx="122" cy="90" rx="15" ry="13" [attr.fill]="'url(#' + gradId + '-baby)'" />
          <path
            d="M127 88 C131 89 134 92 132 94"
            stroke="#fff"
            stroke-width="1.4"
            stroke-linecap="round"
            opacity="0.5"
            fill="none"
          />
          <path
            d="M92 122 C86 128 84 134 90 136"
            stroke="#fda4af"
            stroke-width="2.8"
            stroke-linecap="round"
            fill="none"
            opacity="0.75"
          />
          <path
            d="M126 116 C132 122 134 128 128 130"
            stroke="#fda4af"
            stroke-width="2.5"
            stroke-linecap="round"
            fill="none"
            opacity="0.7"
          />
        </g>
        }
      </g>

      <circle
        class="pregnancy-hero-svg__pulse"
        cx="100"
        cy="100"
        r="54"
        fill="none"
        stroke="#f472b6"
        stroke-width="1"
        opacity="0.35"
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

      .pregnancy-hero-svg__arcs {
        transform-origin: 100px 100px;
        animation: pregnancy-hero-svg-rotate 24s linear infinite;
      }

      .pregnancy-hero-svg__orb--a {
        animation: pregnancy-hero-svg-float-a 7s ease-in-out infinite;
      }

      .pregnancy-hero-svg__orb--b {
        animation: pregnancy-hero-svg-float-b 8.5s ease-in-out infinite;
      }

      .pregnancy-hero-svg__baby {
        transform-origin: 100px 104px;
        animation: pregnancy-hero-svg-breathe 4.5s ease-in-out infinite;
      }

      .pregnancy-hero-svg__pulse {
        transform-origin: 100px 100px;
        animation: pregnancy-hero-svg-pulse 3.2s ease-out infinite;
      }

      @keyframes pregnancy-hero-svg-rotate {
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes pregnancy-hero-svg-float-a {
        0%,
        100% {
          transform: translate(0, 0);
        }
        50% {
          transform: translate(-4px, 5px);
        }
      }

      @keyframes pregnancy-hero-svg-float-b {
        0%,
        100% {
          transform: translate(0, 0);
        }
        50% {
          transform: translate(5px, -4px);
        }
      }

      @keyframes pregnancy-hero-svg-breathe {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.04);
        }
      }

      @keyframes pregnancy-hero-svg-pulse {
        0% {
          transform: scale(0.94);
          opacity: 0.42;
        }
        70% {
          transform: scale(1.05);
          opacity: 0;
        }
        100% {
          transform: scale(1.05);
          opacity: 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .pregnancy-hero-svg__arcs,
        .pregnancy-hero-svg__orb--a,
        .pregnancy-hero-svg__orb--b,
        .pregnancy-hero-svg__baby,
        .pregnancy-hero-svg__pulse {
          animation: none;
        }
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

  stage(): PregnancyHeroStage {
    const w = Math.min(40, Math.max(1, Math.round(Number(this.week) || 1)));
    if (w <= 10) {
      return 'early';
    }
    if (w <= 24) {
      return 'mid';
    }
    return 'late';
  }

  babyTransform(): string {
    const w = Math.min(40, Math.max(1, Math.round(Number(this.week) || 1)));
    const stage = this.stage();
    const base = stage === 'early' ? 0.88 : stage === 'mid' ? 1 : 1.08;
    const growth = (w / 40) * 0.08;
    const s = base + growth;
    return `translate(100 104) scale(${s}) translate(-100 -104)`;
  }
}
