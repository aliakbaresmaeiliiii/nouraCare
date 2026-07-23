import { Location } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LEGAL_LAST_UPDATED_ISO } from '@app/shared/content/legal-meta';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';
import { formatLegalEffectiveDate } from '@app/shared/utils/locale-date-format.util';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';

export interface LegalBlock {
  type: 'paragraph' | 'list';
  text?: string;
  items?: string[];
}

export interface LegalSection {
  id: string;
  number?: string;
  heading?: string;
  blocks: LegalBlock[];
}

export interface LegalHighlight {
  icon: string;
  titleKey: string;
  textKey: string;
}

@Component({
  selector: 'app-settings-legal-page',
  templateUrl: './settings-legal-page.component.html',
  styleUrls: ['./settings-legal-page.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class SettingsLegalPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private languageSub?: Subscription;

  titleKey = 'settings.privacyPolicy.title';
  subtitleKey?: string;
  bodyKey = 'settings.privacyPolicy.body';
  showEffectiveDate = false;
  effectiveDateDisplay = '';
  heroIcon = 'shield-checkmark';
  documentType: 'privacy' | 'terms' = 'privacy';
  contactEmail = 'support@dorehealth.app';
  contactTextKey = 'settings.legal.privacyContactText';
  tocExpanded = false;

  readonly privacyHighlights: LegalHighlight[] = [
    {
      icon: 'shield-checkmark',
      titleKey: 'settings.privacyPolicy.highlight1Title',
      textKey: 'settings.privacyPolicy.highlight1Text',
    },
    {
      icon: 'hand-left',
      titleKey: 'settings.privacyPolicy.highlight2Title',
      textKey: 'settings.privacyPolicy.highlight2Text',
    },
    {
      icon: 'lock-closed',
      titleKey: 'settings.privacyPolicy.highlight3Title',
      textKey: 'settings.privacyPolicy.highlight3Text',
    },
  ];

  readonly termsHighlights: LegalHighlight[] = [
    {
      icon: 'document-text',
      titleKey: 'settings.terms.highlight1Title',
      textKey: 'settings.terms.highlight1Text',
    },
    {
      icon: 'medical',
      titleKey: 'settings.terms.highlight2Title',
      textKey: 'settings.terms.highlight2Text',
    },
    {
      icon: 'scale',
      titleKey: 'settings.terms.highlight3Title',
      textKey: 'settings.terms.highlight3Text',
    },
  ];

  ngOnInit(): void {
    const data = this.route.snapshot.data as {
      titleKey?: string;
      subtitleKey?: string;
      bodyKey?: string;
      showEffectiveDate?: boolean;
      heroIcon?: string;
      documentType?: 'privacy' | 'terms';
      contactEmail?: string;
      contactTextKey?: string;
    };

    if (data.titleKey) {
      this.titleKey = data.titleKey;
    }
    if (data.subtitleKey) {
      this.subtitleKey = data.subtitleKey;
    }
    if (data.bodyKey) {
      this.bodyKey = data.bodyKey;
    }
    this.showEffectiveDate = !!data.showEffectiveDate;
    if (data.heroIcon) {
      this.heroIcon = data.heroIcon;
    }
    if (data.documentType) {
      this.documentType = data.documentType;
    }
    if (data.contactEmail) {
      this.contactEmail = data.contactEmail;
    }
    if (data.contactTextKey) {
      this.contactTextKey = data.contactTextKey;
    }

    this.refreshEffectiveDateDisplay();
    this.languageSub = this.languageService.currentLanguage$.subscribe(() => {
      this.refreshEffectiveDateDisplay();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.languageSub?.unsubscribe();
  }

  get highlights(): LegalHighlight[] {
    return this.documentType === 'terms'
      ? this.termsHighlights
      : this.privacyHighlights;
  }

  get highlightsTitleKey(): string {
    return this.documentType === 'terms'
      ? 'settings.terms.highlightsTitle'
      : 'settings.privacyPolicy.highlightsTitle';
  }

  get introText(): string | null {
    const sections = this.legalSections;
    if (!sections.length || sections[0].heading) {
      return null;
    }

    const intro = sections[0].blocks
      .filter((block) => block.type === 'paragraph' && block.text)
      .map((block) => block.text!)
      .join(' ');

    return intro || null;
  }

  get contentSections(): LegalSection[] {
    const sections = this.legalSections;
    if (!sections.length || sections[0].heading) {
      return sections;
    }
    return sections.slice(1);
  }

  /** Parses body text: lines starting with "## " are section headings; other lines are paragraphs. */
  get legalSections(): LegalSection[] {
    const sections: LegalSection[] = [];
    let current: LegalSection = { id: 'intro', blocks: [] };

    for (const line of this.translation.translate(this.bodyKey).split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      if (trimmed.startsWith('## ')) {
        if (current.heading || current.blocks.length) {
          sections.push(current);
        }
        const heading = trimmed.slice(3).trim();
        const numberMatch = heading.match(/^(\d+)\.\s*(.+)$/);
        current = {
          id: this.sectionId(heading),
          number: numberMatch?.[1],
          heading: numberMatch ? numberMatch[2] : heading,
          blocks: [],
        };
      } else {
        current.blocks.push(...this.parseParagraph(trimmed));
      }
    }

    if (current.heading || current.blocks.length) {
      sections.push(current);
    }

    return sections;
  }

  toggleToc(): void {
    this.tocExpanded = !this.tocExpanded;
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.tocExpanded = false;
    }
  }

  openContactEmail(): void {
    window.location.href = `mailto:${this.contactEmail}`;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigate(['/settings']);
  }

  private refreshEffectiveDateDisplay(): void {
    if (!this.showEffectiveDate) {
      this.effectiveDateDisplay = '';
      return;
    }
    const prefix = this.translation.translate('settings.legal.lastUpdatedPrefix');
    const dateStr = formatLegalEffectiveDate(
      LEGAL_LAST_UPDATED_ISO,
      this.languageService.getCurrentLanguage(),
    );
    this.effectiveDateDisplay = `${prefix} ${dateStr}`;
  }

  private sectionId(heading: string): string {
    return heading
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  private parseParagraph(text: string): LegalBlock[] {
    const listMarkers = this.extractListMarkers(text);

    if (listMarkers.length >= 2) {
      const intro = text.slice(0, listMarkers[0].index).trim().replace(/:\s*$/, '');
      const items: string[] = [];

      for (let i = 0; i < listMarkers.length; i++) {
        const start = listMarkers[i].index! + listMarkers[i][0].length;
        const end = i + 1 < listMarkers.length ? listMarkers[i + 1].index! : text.length;
        items.push(text.slice(start, end).trim().replace(/[;.]?\s*$/, ''));
      }

      const blocks: LegalBlock[] = [];
      if (intro) {
        blocks.push({ type: 'paragraph', text: intro });
      }
      if (items.length) {
        blocks.push({ type: 'list', items });
      }
      return blocks.length ? blocks : [{ type: 'paragraph', text }];
    }

    return [{ type: 'paragraph', text }];
  }

  private extractListMarkers(text: string): RegExpMatchArray[] {
    const regex = /\(([a-z]|ال[ف-ی])\)\s*|（([a-z])）\s*/gi;
    const markers: RegExpMatchArray[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      markers.push(match);
    }

    return markers;
  }
}
