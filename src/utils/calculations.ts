import { AssessmentType, GradeRecord } from '../types';

/**
 * Bobot default penilaian:
 * - Formatif: 20%
 * - Sumatif Lingkup Materi: 30%
 * - Sumatif Tengah Semester: 25%
 * - Sumatif Akhir Semester: 25%
 */
export const DEFAULT_ASSESSMENT_WEIGHTS: Record<AssessmentType, number> = {
  'Formatif': 20,
  'Sumatif Lingkup Materi': 30,
  'Sumatif Tengah Semester': 25,
  'Sumatif Akhir Semester': 25,
};

/**
 * Menghitung Nilai Akhir (NA) dari daftar catatan nilai mata pelajaran
 */
export function calculateFinalScore(
  grades: GradeRecord[],
  weights: Record<AssessmentType, number> = DEFAULT_ASSESSMENT_WEIGHTS
): { finalScore: number | null; summary: Record<string, number | null>; isComplete: boolean } {
  const scoresByType: Record<AssessmentType, number[]> = {
    'Formatif': [],
    'Sumatif Lingkup Materi': [],
    'Sumatif Tengah Semester': [],
    'Sumatif Akhir Semester': [],
  };

  grades.forEach(g => {
    if (g.score !== null && g.score !== undefined && !isNaN(g.score)) {
      if (scoresByType[g.assessmentType]) {
        scoresByType[g.assessmentType].push(g.score);
      }
    }
  });

  const avgByType: Record<string, number | null> = {};
  let weightedSum = 0;
  let totalWeight = 0;
  let hasAnyScore = false;

  (Object.keys(scoresByType) as AssessmentType[]).forEach(type => {
    const list = scoresByType[type];
    if (list.length > 0) {
      const avg = list.reduce((a, b) => a + b, 0) / list.length;
      avgByType[type] = Math.round(avg * 10) / 10;
      weightedSum += avg * (weights[type] || 0);
      totalWeight += (weights[type] || 0);
      hasAnyScore = true;
    } else {
      avgByType[type] = null;
    }
  });

  if (!hasAnyScore || totalWeight === 0) {
    return { finalScore: null, summary: avgByType, isComplete: false };
  }

  const finalScore = Math.round((weightedSum / totalWeight) * 10) / 10;
  const isComplete = Boolean(
    avgByType['Formatif'] !== null &&
    avgByType['Sumatif Lingkup Materi'] !== null &&
    avgByType['Sumatif Tengah Semester'] !== null &&
    avgByType['Sumatif Akhir Semester'] !== null
  );

  return { finalScore, summary: avgByType, isComplete };
}

/**
 * Menghasilkan deskripsi capaian kompetensi otomatis dari data nilai
 */
export function generateCompetencyDescription(studentName: string, subject: string, score: number | null): string {
  if (score === null || isNaN(score)) {
    return `Menunjukkan proses belajar pada mata pelajaran ${subject}.`;
  }
  if (score >= 88) {
    return `Menunjukkan penguasaan yang sangat baik dalam memahami konsep serta mampu menerapkan keterampilan pada mata pelajaran ${subject} secara mandiri.`;
  }
  if (score >= 74) {
    return `Menunjukkan penguasaan yang baik dalam tujuan pembelajaran mata pelajaran ${subject} dan mampu menyelesaikan tugas dengan baik.`;
  }
  if (score >= 60) {
    return `Cukup menguasai kompetensi dasar pada mata pelajaran ${subject}, namun perlu peningkatan ketelitian dan latihan berkelanjutan.`;
  }
  return `Perlu bimbingan dan pendampingan lebih lanjut dalam memahami kompetensi esensial pada mata pelajaran ${subject}.`;
}
