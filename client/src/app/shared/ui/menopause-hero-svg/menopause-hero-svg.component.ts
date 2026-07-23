import { Component, Input } from '@angular/core';

/**
 * Calm menopause / perimenopause hero — moon arc, cool slate–violet palette.
 */
@Component({
  selector: 'app-menopause-hero-svg',
  standalone: true,
  template: `
    <svg
      class="menopause-hero-svg__art"
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient [attr.id]="gradId + '-mesh'" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stop-color="#fff" stop-opacity="0.96" />
          <stop offset="45%" stop-color="#e0e7ff" stop-opacity="0.72" />
          <stop offset="100%" stop-color="#cbd5e1" stop-opacity="0.2" />
        </radialGradient>
        <linearGradient [attr.id]="gradId + '-arc'" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#94a3b8" />
          <stop offset="100%" stop-color="#818cf8" />
        </linearGradient>
        <linearGradient [attr.id]="gradId + '-moon'" x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stop-color="#e2e8f0" />
          <stop offset="55%" stop-color="#cbd5e1" />
          <stop offset="100%" stop-color="#94a3b8" />
        </linearGradient>
        <filter [attr.id]="gradId + '-blur'" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      <circle cx="100" cy="100" r="78" [attr.fill]="'url(#' + gradId + '-mesh)'" />

      <circle
        class="menopause-hero-svg__orb menopause-hero-svg__orb--a"
        cx="128"
        cy="74"
        r="26"
        fill="#c7d2fe"
        opacity="0.55"
        [attr.filter]="'url(#' + gradId + '-blur)'"
      />
      <circle
        class="menopause-hero-svg__orb menopause-hero-svg__orb--b"
        cx="70"
        cy="122"
        r="22"
        fill="#e2e8f0"
        opacity="0.5"
        [attr.filter]="'url(#' + gradId + '-blur)'"
      />

      <g
        class="menopause-hero-svg__arcs"
        fill="none"
        [attr.stroke]="'url(#' + gradId + '-arc)'"
        stroke-linecap="round"
      >
        <circle cx="100" cy="100" r="68" stroke-width="1.3" opacity="0.22" />
        <path d="M100 36 A64 64 0 0 1 164 100" stroke-width="2" opacity="0.38" />
        <path d="M164 100 A64 64 0 0 1 100 164" stroke-width="1.6" opacity="0.24" />
      </g>

      <g class="menopause-hero-svg__moon" [attr.transform]="moonTransform()">
        <circle cx="100" cy="100" r="28" [attr.fill]="'url(#' + gradId + '-moon)'" />
        <circle cx="112" cy="92" r="22" fill="#f8fafc" opacity="0.92" />
        @if (stage === 'perimenopause') {
        <circle cx="88" cy="108" r="3.5" fill="#818cf8" opacity="0.55" />
        <circle cx="104" cy="118" r="2.5" fill="#a5b4fc" opacity="0.45" />
        }
      </g>

      <circle
        class="menopause-hero-svg__pulse"
        cx="100"
        cy="100"
        r="34"
        fill="none"
        stroke="#818cf8"
        stroke-width="1.2"
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
      .menopause-hero-svg__art {
        width: 100%;
        height: 100%;
        display: block;
      }
      .menopause-hero-svg__arcs {
        transform-box: fill-box;
        transform-origin: center;
        animation: menopause-hero-rotate 26s linear infinite;
      }
      .menopause-hero-svg__orb--a {
        animation: menopause-hero-float-a 7.5s ease-in-out infinite;
      }
      .menopause-hero-svg__orb--b {
        animation: menopause-hero-float-b 9s ease-in-out infinite;
      }
      .menopause-hero-svg__moon {
        animation: menopause-hero-breathe 5s ease-in-out infinite;
      }
      .menopause-hero-svg__pulse {
        animation: menopause-hero-pulse 3.5s ease-out infinite;
      }
      @keyframes menopause-hero-rotate {
        to {
          transform: rotate(360deg);
        }
      }
      @keyframes menopause-hero-float-a {
        0%,
        100% {
          transform: translate(0, 0);
        }
        50% {
          transform: translate(-4px, 5px);
        }
      }
      @keyframes menopause-hero-float-b {
        0%,
        100% {
          transform: translate(0, 0);
        }
        50% {
          transform: translate(5px, -4px);
        }
      }
      @keyframes menopause-hero-breathe {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.03);
        }
      }
      @keyframes menopause-hero-pulse {
        0% {
          r: 34;
          opacity: 0.35;
        }
        70% {
          r: 48;
          opacity: 0;
        }
        100% {
          r: 48;
          opacity: 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .menopause-hero-svg__arcs,
        .menopause-hero-svg__orb--a,
        .menopause-hero-svg__orb--b,
        .menopause-hero-svg__moon,
        .menopause-hero-svg__pulse {
          animation: none;
        }
      }
    `,
  ],
  host: {
    class: 'menopause-hero-svg',
  },
})
export class MenopauseHeroSvgComponent {
  @Input() stage: 'perimenopause' | 'menopause' = 'perimenopause';

  readonly gradId = `menopause-hero-${Math.random().toString(36).slice(2, 9)}`;

  moonTransform(): string {
    return this.stage === 'menopause' ? 'translate(0 0)' : 'translate(0 -2)';
  }
}
