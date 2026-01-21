import React, { useState } from 'react';

// --- Types & Data Structures ---

type MaritalStatus = 'Single' | 'Married' | 'Common-Law';

// Education Options (Used for Logic Keys)
type EducationLevel = 
  | 'None' 
  | 'Secondary' 
  | 'OneYear' 
  | 'TwoYear' 
  | 'ThreeYear' 
  | 'TwoOrMore' 
  | 'Masters' 
  | 'PhD';

type Category = 
  | 'General' 
  | 'Healthcare' 
  | 'STEM' 
  | 'Trades' 
  | 'Transport' 
  | 'Agriculture' 
  | 'French' 
  | 'None';

interface UserProfile {
  maritalStatus: MaritalStatus;
  spouseAccompanying: boolean; 
  spouseCanadian: boolean; 
  age: number;
  education: EducationLevel;
  canadianEducation: 'None' | '1or2Year' | '3YearOrMore';
  english: { speak: number; listen: number; read: number; write: number }; // CLB
  french: { speak: number; listen: number; read: number; write: number }; // CLB
  workInCanada: number; // Years
  workForeign: number; // Years
  certificateOfQualification: boolean;
  pnp: boolean; // Provincial Nomination
  siblingInCanada: boolean;
  category: Category;
  
  // Spouse Factors
  spouseEducation: EducationLevel;
  spouseWorkInCanada: number; // Years
  spouseEnglish: { speak: number; listen: number; read: number; write: number }; // CLB
}

interface CRSBreakdown {
  total: number;
  core: {
    age: number;
    education: number;
    language: number;
    canadianWork: number;
    subtotal: number;
  };
  spouse: {
    education: number;
    language: number;
    work: number;
    subtotal: number;
  };
  transferability: {
    education: number;
    foreignWork: number;
    certificate: number;
    subtotal: number;
  };
  additional: {
    sibling: number;
    french: number;
    education: number;
    pnp: number;
    subtotal: number;
  };
}

const initialProfile: UserProfile = {
  maritalStatus: 'Single',
  spouseAccompanying: false,
  spouseCanadian: false,
  age: 25,
  education: 'ThreeYear',
  canadianEducation: 'None',
  english: { speak: 7, listen: 7, read: 7, write: 7 },
  french: { speak: 0, listen: 0, read: 0, write: 0 },
  workInCanada: 0,
  workForeign: 0,
  certificateOfQualification: false,
  pnp: false,
  siblingInCanada: false,
  category: 'None',
  
  spouseEducation: 'None',
  spouseWorkInCanada: 0,
  spouseEnglish: { speak: 0, listen: 0, read: 0, write: 0 },
};

// --- Education Mappings (For UI display and Key mapping) ---
const EDUCATION_MAP: Record<EducationLevel, string> = {
  None: 'Less than secondary school (high school)',
  Secondary: 'Secondary diploma (high school graduation)',
  OneYear: 'One-year degree, diploma or certificate',
  TwoYear: 'Two-year program',
  ThreeYear: 'Bachelor\'s degree OR three or more year program',
  TwoOrMore: 'Two or more certificates/degrees (One must be for 3+ years)',
  Masters: 'Master\'s degree, or professional degree',
  PhD: 'Doctoral level university degree (Ph.D.)'
};

const EDUCATION_OPTIONS_UI = Object.values(EDUCATION_MAP);
const EDUCATION_MAP_REVERSE = Object.fromEntries(
    Object.entries(EDUCATION_MAP).map(([key, value]) => [value, key as EducationLevel])
);

// --- Jargon Definitions mapped by key ---
const JARGON_MAP: Record<string, { acronym: string, definition: string, meaning: string }> = {
    ECA: { acronym: 'ECA', definition: 'Educational Credential Assessment', meaning: 'A report that verifies your foreign degree, diploma, or certificate is valid and equal to a Canadian credential.' },
    CLB: { acronym: 'CLB', definition: 'Canadian Language Benchmark', meaning: 'The standardized measure of English/French language ability used for immigration purposes. CLB 7 is typically the minimum requirement for Express Entry.' },
    TEER: { acronym: 'TEER', definition: 'Training, Education, Experience, and Responsibilities', meaning: 'The system used to classify occupations (previously NOC codes). Only experience in TEER 0, 1, 2, or 3 is considered skilled work.' },
    PNP: { acronym: 'PNP', definition: 'Provincial Nominee Program', meaning: 'A stream where a Canadian province selects candidates who meet their specific labor market needs, automatically awarding 600 CRS points.' },
};

// --- Historical Draw Data (Expanded) ---
interface Draw {
    stream: string;
    score: number;
    date: string;
    category?: Category | 'CEC' | 'PNP'; // Category used for grouping/filtering
}

const ALL_DRAW_HISTORY: Draw[] = [
  // General Draws (No specific category)
  { stream: 'General / All Programs', score: 529, date: 'Apr 23, 2024' },
  { stream: 'General / All Programs', score: 535, date: 'Apr 02, 2024' },
  { stream: 'General / All Programs', score: 531, date: 'Mar 17, 2024' },
  { stream: 'General / All Programs', score: 542, date: 'Feb 26, 2024' },
  { stream: 'General / All Programs', score: 557, date: 'Feb 12, 2024' },

  // CEC Draws (Canadian Experience Class)
  { stream: 'Canadian Experience Class (CEC)', score: 533, date: 'Nov 12, 2025', category: 'CEC' },
  { stream: 'Canadian Experience Class (CEC)', score: 541, date: 'Sep 05, 2025', category: 'CEC' },
  { stream: 'Canadian Experience Class (CEC)', score: 550, date: 'Jul 21, 2025', category: 'CEC' },
  { stream: 'Canadian Experience Class (CEC)', score: 560, date: 'May 10, 2025', category: 'CEC' },
  { stream: 'Canadian Experience Class (CEC)', score: 575, date: 'Mar 01, 2025', category: 'CEC' },
  
  // PNP Draws (Provincial Nominees)
  { stream: 'Provincial Nominee Program (PNP)', score: 738, date: 'Nov 10, 2025', category: 'PNP' },
  { stream: 'Provincial Nominee Program (PNP)', score: 752, date: 'Aug 19, 2025', category: 'PNP' },
  { stream: 'Provincial Nominee Program (PNP)', score: 765, date: 'Jun 30, 2025', category: 'PNP' },
  { stream: 'Provincial Nominee Program (PNP)', score: 780, date: 'May 05, 2025', category: 'PNP' },
  { stream: 'Provincial Nominee Program (PNP)', score: 791, date: 'Mar 11, 2025', category: 'PNP' },

  // Category-Based Draws
  { stream: 'French Proficiency', score: 416, date: 'Oct 29, 2025', category: 'French' },
  { stream: 'French Proficiency', score: 425, date: 'Aug 10, 2025', category: 'French' },
  { stream: 'French Proficiency', score: 430, date: 'Jun 15, 2025', category: 'French' },
  { stream: 'French Proficiency', score: 451, date: 'Apr 08, 2025', category: 'French' },
  { stream: 'French Proficiency', score: 460, date: 'Feb 14, 2025', category: 'French' },

  { stream: 'Healthcare Occupations', score: 462, date: 'Nov 14, 2025', category: 'Healthcare' },
  { stream: 'Healthcare Occupations', score: 470, date: 'Sep 29, 2025', category: 'Healthcare' },
  { stream: 'Healthcare Occupations', score: 485, date: 'Jul 11, 2025', category: 'Healthcare' },
  { stream: 'Healthcare Occupations', score: 490, date: 'May 20, 2025', category: 'Healthcare' },
  { stream: 'Healthcare Occupations', score: 501, date: 'Mar 10, 2025', category: 'Healthcare' },

  { stream: 'Trades Occupations', score: 505, date: 'Sep 18, 2025', category: 'Trades' },
  { stream: 'Trades Occupations', score: 512, date: 'Jul 01, 2025', category: 'Trades' },
  { stream: 'Trades Occupations', score: 520, date: 'May 01, 2025', category: 'Trades' },
  { stream: 'Trades Occupations', score: 528, date: 'Feb 15, 2025', category: 'Trades' },

  { stream: 'STEM Occupations', score: 491, date: 'Apr 11, 2024', category: 'STEM' },
  { stream: 'STEM Occupations', score: 499, date: 'Mar 01, 2024', category: 'STEM' },
  { stream: 'STEM Occupations', score: 505, date: 'Jan 10, 2024', category: 'STEM' },
  
  { stream: 'Transport Occupations', score: 430, date: 'Mar 13, 2024', category: 'Transport' },
  { stream: 'Transport Occupations', score: 445, date: 'Feb 01, 2024', category: 'Transport' },
  { stream: 'Transport Occupations', score: 450, date: 'Dec 15, 2023', category: 'Transport' },
];

// Helper to group and extract latest score for display
const GROUPED_DRAWS = ALL_DRAW_HISTORY.reduce((acc, draw) => {
    const key = draw.stream;
    if (!acc[key]) {
        acc[key] = {
            stream: draw.stream,
            latestScore: draw.score,
            category: draw.category || 'General',
            history: []
        };
    }
    acc[key].history.push({ score: draw.score, date: draw.date });
    return acc;
}, {} as Record<string, { stream: string, latestScore: number, category: Category | 'CEC' | 'PNP' | 'General', history: { score: number, date: string }[] }>);


// --- CRS CALCULATOR LOGIC ---
const calculateCRS = (p: UserProfile): CRSBreakdown => {
    const breakdown = {
        total: 0,
        core: { age: 0, education: 0, language: 0, canadianWork: 0, subtotal: 0 },
        spouse: { education: 0, language: 0, work: 0, subtotal: 0 },
        transferability: { education: 0, foreignWork: 0, certificate: 0, subtotal: 0 },
        additional: { sibling: 0, french: 0, education: 0, pnp: 0, subtotal: 0 }
    };
  
    const withSpouse = (p.maritalStatus === 'Married' || p.maritalStatus === 'Common-Law') 
                       && p.spouseAccompanying 
                       && !p.spouseCanadian;
  
    // 1. Age (A-1)
    const getAgePoints = (age: number, accompanied: boolean) => {
        if (age <= 17 || age >= 45) return 0;
        const ageMap: Record<number, { s: number, m: number }> = {
            18: { s: 99, m: 90 }, 19: { s: 105, m: 95 },
            20: { s: 110, m: 100 }, 21: { s: 110, m: 100 }, 22: { s: 110, m: 100 }, 
            23: { s: 110, m: 100 }, 24: { s: 110, m: 100 }, 25: { s: 110, m: 100 }, 
            26: { s: 110, m: 100 }, 27: { s: 110, m: 100 }, 28: { s: 110, m: 100 }, 
            29: { s: 110, m: 100 },
            30: { s: 105, m: 95 }, 31: { s: 99, m: 90 }, 32: { s: 94, m: 85 },
            33: { s: 88, m: 80 }, 34: { s: 83, m: 75 }, 35: { s: 77, m: 70 },
            36: { s: 72, m: 65 }, 37: { s: 66, m: 60 }, 38: { s: 61, m: 55 },
            39: { s: 55, m: 50 }, 40: { s: 50, m: 45 }, 41: { s: 39, m: 35 },
            42: { s: 28, m: 25 }, 43: { s: 17, m: 15 }, 44: { s: 6, m: 5 }
        };
        return accompanied ? ageMap[p.age]?.m ?? 0 : ageMap[p.age]?.s ?? 0;
    };
    breakdown.core.age = getAgePoints(p.age, withSpouse);
  
    // 2. Education (A-2)
    const eduPointsMap: Record<EducationLevel, { s: number, m: number }> = {
        None: { s: 0, m: 0 }, Secondary: { s: 30, m: 28 }, OneYear: { s: 90, m: 84 },
        TwoYear: { s: 98, m: 91 }, ThreeYear: { s: 120, m: 112 }, TwoOrMore: { s: 128, m: 119 },
        Masters: { s: 135, m: 126 }, PhD: { s: 150, m: 140 }
    };
    breakdown.core.education = withSpouse ? eduPointsMap[p.education].m : eduPointsMap[p.education].s;
  
    // 3. Official Languages (A-3)
    const getLangPointsFirst = (clb: number, accompanied: boolean) => {
        if (accompanied) {
            if (clb >= 10) return 32;
            if (clb === 9) return 29;
            if (clb === 8) return 22;
            if (clb === 7) return 16;
            if (clb === 6) return 8;
            if (clb === 4 || clb === 5) return 6;
            return 0;
        } else {
            if (clb >= 10) return 34;
            if (clb === 9) return 31;
            if (clb === 8) return 23;
            if (clb === 7) return 17;
            if (clb === 6) return 9;
            if (clb === 4 || clb === 5) return 6;
            return 0;
        }
    };
    let langScore = 0;
    langScore += getLangPointsFirst(p.english.speak, withSpouse);
    langScore += getLangPointsFirst(p.english.listen, withSpouse);
    langScore += getLangPointsFirst(p.english.read, withSpouse);
    langScore += getLangPointsFirst(p.english.write, withSpouse);
  
    // 4. Second Official Language (A-3, continued)
    const getLangPointsSecond = (clb: number) => {
        if (clb >= 9) return 6;
        if (clb === 7 || clb === 8) return 3;
        if (clb === 5 || clb === 6) return 1;
        return 0;
    };
    langScore += getLangPointsSecond(p.french.speak);
    langScore += getLangPointsSecond(p.french.listen);
    langScore += getLangPointsSecond(p.french.read);
    langScore += getLangPointsSecond(p.french.write);
    
    breakdown.core.language = langScore;
  
    // 5. Canadian Work (A-4)
    const canWorkPoints: Record<number, { s: number, m: number }> = {
        0: { s: 0, m: 0 }, 1: { s: 40, m: 35 }, 2: { s: 53, m: 46 },
        3: { s: 64, m: 56 }, 4: { s: 72, m: 63 }, 5: { s: 80, m: 70 }
    };
    const cdnWorkYears = Math.min(p.workInCanada, 5);
    breakdown.core.canadianWork = withSpouse ? canWorkPoints[cdnWorkYears].m : canWorkPoints[cdnWorkYears].s;
  
    breakdown.core.subtotal = breakdown.core.age + breakdown.core.education + breakdown.core.language + breakdown.core.canadianWork;
  
    // --- B. Spouse Factors ---
    if (withSpouse) {
        const spouseEduMap: Record<EducationLevel, number> = {
            None: 0, Secondary: 2, OneYear: 6, TwoYear: 7, 
            ThreeYear: 8, TwoOrMore: 9, Masters: 10, PhD: 10
        };
        breakdown.spouse.education = spouseEduMap[p.spouseEducation];
  
        const spouseWorkMap: Record<number, number> = { 0: 0, 1: 5, 2: 7, 3: 8, 4: 9, 5: 10 };
        breakdown.spouse.work = spouseWorkMap[Math.min(p.spouseWorkInCanada, 5)];
  
        const getSpouseLang = (clb: number) => {
            if (clb >= 9) return 5;
            if (clb === 7 || clb === 8) return 3;
            if (clb === 5 || clb === 6) return 1;
            return 0;
        };
        let spLang = 0;
        spLang += getSpouseLang(p.spouseEnglish.speak);
        spLang += getSpouseLang(p.spouseEnglish.listen);
        spLang += getSpouseLang(p.spouseEnglish.read);
        spLang += getSpouseLang(p.spouseEnglish.write);
        breakdown.spouse.language = spLang;
  
        breakdown.spouse.subtotal = breakdown.spouse.education + breakdown.spouse.work + breakdown.spouse.language;
    }
  
    // --- C. Transferability ---
    const isCLB7 = (l: any) => l.speak >= 7 && l.listen >= 7 && l.read >= 7 && l.write >= 7;
    const isCLB9 = (l: any) => l.speak >= 9 && l.listen >= 9 && l.read >= 9 && l.write >= 9;
    const clb7 = isCLB7(p.english);
    const clb9 = isCLB9(p.english);
    const hasTwoOrMoreDeg = (p.education === 'TwoOrMore' || p.education === 'Masters' || p.education === 'PhD');
    const hasPostSec = (p.education !== 'None' && p.education !== 'Secondary');
  
    // Edu + Lang / Work
    let eduLangPoints = 0;
    if (clb9 && hasTwoOrMoreDeg) eduLangPoints = 50;
    else if (clb9 && hasPostSec) eduLangPoints = 25;
    else if (clb7 && hasTwoOrMoreDeg) eduLangPoints = 25;
    else if (clb7 && hasPostSec) eduLangPoints = 13;
    
    let eduWorkPoints = 0;
    if (p.workInCanada >= 2 && hasTwoOrMoreDeg) eduWorkPoints = 50;
    else if (p.workInCanada >= 2 && hasPostSec) eduWorkPoints = 25;
    else if (p.workInCanada === 1 && hasTwoOrMoreDeg) eduWorkPoints = 25;
    else if (p.workInCanada === 1 && hasPostSec) eduWorkPoints = 13;
  
    breakdown.transferability.education = Math.min(50, eduLangPoints + eduWorkPoints);
  
    // Work + Lang / Cdn Work
    let forLangPoints = 0;
    if (clb9 && p.workForeign >= 3) forLangPoints = 50;
    else if (clb9 && p.workForeign >= 1) forLangPoints = 25;
    else if (clb7 && p.workForeign >= 3) forLangPoints = 25;
    else if (clb7 && p.workForeign >= 1) forLangPoints = 13;
  
    let forCdnPoints = 0;
    if (p.workInCanada >= 2 && p.workForeign >= 3) forCdnPoints = 50;
    else if (p.workInCanada >= 2 && p.workForeign >= 1) forCdnPoints = 25;
    else if (p.workInCanada === 1 && p.workForeign >= 3) forCdnPoints = 25;
    else if (p.workInCanada === 1 && p.workForeign >= 1) forCdnPoints = 13;
  
    breakdown.transferability.foreignWork = Math.min(50, forLangPoints + forCdnPoints);
  
    // Certificate
    if (p.certificateOfQualification) {
        if (clb7) breakdown.transferability.certificate = 50;
        else if (p.english.speak >= 5 && p.english.listen >= 5 && p.english.read >= 5 && p.english.write >= 5) breakdown.transferability.certificate = 25;
    }
  
    breakdown.transferability.subtotal = Math.min(100, breakdown.transferability.education + breakdown.transferability.foreignWork + breakdown.transferability.certificate);
  
    // --- D. Additional ---
    if (p.siblingInCanada) breakdown.additional.sibling = 15;
    
    const french7 = isCLB7(p.french);
    const english5 = p.english.speak >= 5 && p.english.listen >= 5 && p.english.read >= 5 && p.english.write >= 5;
    if (french7) {
        breakdown.additional.french = english5 ? 50 : 25;
    }
  
    if (p.canadianEducation === '1or2Year') breakdown.additional.education = 15;
    if (p.canadianEducation === '3YearOrMore') breakdown.additional.education = 30;
  
    if (p.pnp) breakdown.additional.pnp = 600;
  
    breakdown.additional.subtotal = Math.min(600, breakdown.additional.sibling + breakdown.additional.french + breakdown.additional.education + breakdown.additional.pnp);
  
    // Total
    breakdown.total = breakdown.core.subtotal + breakdown.spouse.subtotal + breakdown.transferability.subtotal + breakdown.additional.subtotal;
  
    return breakdown;
};


// --- Draw History Accordion Component ---

interface DrawAccordionProps {
    streamName: string;
    latestScore: number;
    userScore: number;
    history: { score: number, date: string }[];
}

const DrawHistoryAccordion: React.FC<DrawAccordionProps> = ({ streamName, latestScore, userScore, history }) => {
    const [isOpen, setIsOpen] = useState(false);
    const qualified = userScore >= latestScore;

    const baseStyle = qualified ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500';
    const textColor = qualified ? 'text-green-600' : 'text-red-600';
    const arrow = isOpen ? '▲' : '▼';

    return (
        <div className={`border-l-4 rounded shadow-md mb-4 ${baseStyle}`}>
            <button
                className="w-full p-4 flex justify-between items-center text-left"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div>
                    <h4 className="font-bold text-gray-800">{streamName}</h4>
                    <p className="text-sm text-gray-500">Latest Cut-off: {latestScore}</p>
                </div>
                <div className="text-right">
                    <div className="font-bold text-xl">{userScore}</div>
                    <div className={`text-sm font-bold ${textColor}`}>
                        {qualified ? 'INVITED' : 'MISSED'} {arrow}
                    </div>
                </div>
            </button>
            
            {isOpen && (
                <div className="p-4 border-t border-gray-200 bg-white">
                    <p className="font-semibold text-sm mb-2 text-gray-700">Past 5 Draw Scores:</p>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
                        {history.slice(0, 5).map((draw, idx) => (
                            <div 
                                key={idx} 
                                className={`p-2 rounded border ${userScore >= draw.score ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}
                            >
                                <div className="font-bold text-base">{draw.score}</div>
                                <div className="text-gray-600">{draw.date.split(',')[0]}</div>
                            </div>
                        ))}
                    </div>
                    {history.length === 0 && <p className="text-gray-500 italic text-xs">No recent history available for this stream.</p>}
                </div>
            )}
        </div>
    );
};


// --- Components ---

const LandingPage = ({ onStart }: { onStart: () => void }) => (
  // Build Canada style: High contrast, patriotic colors, dense layout
  <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
    {/* Subtle Canadian Flag background element */}
    <div className="absolute inset-0 bg-white opacity-90"></div>
    <div className="absolute left-0 top-0 h-full w-1/4 bg-red-700 opacity-10"></div>
    <div className="absolute right-0 bottom-0 h-full w-1/4 bg-red-700 opacity-10"></div>
    
    <div className="max-w-2xl w-full bg-white shadow-2xl rounded-lg p-8 text-center border-t-8 border-red-700 relative">
      <h1 className="text-5xl font-extrabold text-gray-800 mb-4 tracking-tight">
        CANADA IMMIGRATION QUIZ 
      </h1>
      <p className="text-xl font-bold text-red-700 mb-6 uppercase">
        <span className="text-gray-800 font-normal">Calculate Your</span> Express Entry Score
      </p>
      
      <p className="text-lg text-gray-700 mb-6 border-t border-b py-4">
        "Immigration is a hot topic in Canada. Find out if you qualify for Permanent Residency under the current system based on your age, education, and work experience."
      </p>
      
      <p className="text-lg text-gray-800 font-semibold mb-8">
        Take the test now to see if you would be invited to apply (ITA) in a recent draw.
      </p>
      
      <button 
        onClick={onStart}
        className="bg-red-700 hover:bg-red-800 text-white font-bold py-4 px-10 rounded-lg transition duration-300 text-xl shadow-lg transform hover:scale-105"
      >
        START ASSESSMENT <span className="ml-2">🇨🇦</span>
      </button>
    </div>
  </div>
);

const ResultPage = ({ profile, onRestart }: { profile: UserProfile, onRestart: () => void }) => {
  const breakdown = calculateCRS(profile);
  const userScore = breakdown.total;

  // Prepare draw data for display
  const streamData = Object.values(GROUPED_DRAWS).map(group => {
    // Determine relevance based on profile (for better grouping)
    let relevant = false;
    if (group.category === 'General' || group.category === 'PNP' || group.category === profile.category) relevant = true;
    if (group.category === 'CEC' && profile.workInCanada >= 1) relevant = true;
    if (group.category === 'French' && profile.french.speak >= 7) relevant = true;
    
    return { ...group, relevant };
  }).sort((a, b) => {
    // Sort relevant streams first, then General, then others by latest score
    if (a.relevant && !b.relevant) return -1;
    if (!a.relevant && b.relevant) return 1;
    if (a.category === 'General' && b.category !== 'General') return -1;
    if (a.category !== 'General' && b.category === 'General') return 1;
    return b.latestScore - a.latestScore; // Sort highest cut-off first
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 font-sans">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden border border-red-100">
        
        {/* Header (Red/White High Contrast) */}
        <div className="bg-gray-800 text-white p-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Your Comprehensive Ranking System Score</h2>
          <div className="mt-4 text-8xl font-extrabold text-red-500">{userScore}</div>
          <p className="uppercase tracking-widest text-sm mt-2 opacity-80">Total CRS Score (Max 1200)</p>
        </div>

        <div className="p-8">
          
          {/* Detailed Breakdown */}
          <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b-2 border-red-200 pb-2 flex items-center">
            POINTS BREAKDOWN <span className="ml-2 text-red-700">|</span> 
            <span className="text-base font-normal ml-2">CRS Factors</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border-2 border-red-100 shadow-sm">
              <div className="flex justify-between items-center mb-2 border-b pb-1">
                <h4 className="font-bold text-gray-700">Human Capital (Core)</h4>
                <span className="font-extrabold text-red-700 text-xl">{breakdown.core.subtotal}</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 pl-2 border-l-2 border-gray-300">
                <li className="flex justify-between"><span>Age:</span> <span>{breakdown.core.age}</span></li>
                <li className="flex justify-between"><span>Education:</span> <span>{breakdown.core.education}</span></li>
                <li className="flex justify-between"><span>Official Language:</span> <span>{breakdown.core.language}</span></li>
                <li className="flex justify-between"><span>Canadian Work:</span> <span>{breakdown.core.canadianWork}</span></li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-red-100 shadow-sm">
              <div className="flex justify-between items-center mb-2 border-b pb-1">
                <h4 className="font-bold text-gray-700">Spouse Factors (Max 40)</h4>
                <span className="font-extrabold text-red-700 text-xl">{breakdown.spouse.subtotal}</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 pl-2 border-l-2 border-gray-300">
                <li className="flex justify-between"><span>Education:</span> <span>{breakdown.spouse.education}</span></li>
                <li className="flex justify-between"><span>Language:</span> <span>{breakdown.spouse.language}</span></li>
                <li className="flex justify-between"><span>Cdn Work:</span> <span>{breakdown.spouse.work}</span></li>
              </ul>
              {breakdown.spouse.subtotal === 0 && <p className="text-xs text-gray-400 mt-2 italic">Not applicable (single/spouse is Canadian)</p>}
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-red-100 shadow-sm">
              <div className="flex justify-between items-center mb-2 border-b pb-1">
                <h4 className="font-bold text-gray-700">Skill Transferability (Max 100)</h4>
                <span className="font-extrabold text-red-700 text-xl">{breakdown.transferability.subtotal}</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 pl-2 border-l-2 border-gray-300">
                <li className="flex justify-between"><span>Education Combos:</span> <span>{breakdown.transferability.education}</span></li>
                <li className="flex justify-between"><span>Work Exp Combos:</span> <span>{breakdown.transferability.foreignWork}</span></li>
                <li className="flex justify-between"><span>Trade Certificate:</span> <span>{breakdown.transferability.certificate}</span></li>
              </ul>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-red-100 shadow-sm">
              <div className="flex justify-between items-center mb-2 border-b pb-1">
                <h4 className="font-bold text-gray-700">Additional Points (Max 600)</h4>
                <span className="font-extrabold text-red-700 text-xl">{breakdown.additional.subtotal}</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 pl-2 border-l-2 border-gray-300">
                <li className="flex justify-between"><span>Sibling in Canada:</span> <span>{breakdown.additional.sibling}</span></li>
                <li className="flex justify-between"><span>French Ability:</span> <span>{breakdown.additional.french}</span></li>
                <li className="flex justify-between"><span>Cdn Education:</span> <span>{breakdown.additional.education}</span></li>
                <li className="flex justify-between"><span>Provincial Nomination:</span> <span>{breakdown.additional.pnp}</span></li>
              </ul>
            </div>
          </div>
          
          {/* Draw Results (New Accordion Structure) */}
          <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-red-200 pb-2 flex items-center">
            DRAW ELIGIBILITY <span className="ml-2 text-red-700">|</span> 
            <span className="text-base font-normal ml-2">Recent Express Entry Cut-offs</span>
          </h3>
          <p className="text-gray-600 mb-6">
            Compare your score against the **latest cut-off scores** for various streams. Click to see the volatility of past draws.
          </p>

          <div className="space-y-4">
            {streamData.map((data, idx) => (
                <DrawHistoryAccordion 
                    key={idx}
                    streamName={data.stream}
                    latestScore={data.latestScore}
                    userScore={userScore}
                    history={data.history}
                />
            ))}
          </div>

          {/* Restart Button */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <button
                onClick={onRestart}
                className="w-full bg-red-700 text-white font-bold py-3 rounded-lg hover:bg-red-800 transition shadow-lg text-lg"
            >
                START A NEW ASSESSMENT 🇨🇦
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

// --- Questions ---

const questions = [
  {
    id: 'marital',
    text: "What is your marital status?",
    info: "If you have a spouse or common-law partner who is not Canadian, your core points are lower to allow for their contribution.",
    type: 'select',
    options: ['Single', 'Married', 'Common-Law']
  },
  {
    id: 'spouseCheck',
    text: "Is your spouse or partner a Canadian Citizen or Permanent Resident?",
    info: "If your spouse is already Canadian, you earn points as if you were single.",
    type: 'yesno',
    condition: (p: UserProfile) => p.maritalStatus !== 'Single'
  },
  {
    id: 'spouseAccompany',
    text: "Will your spouse or partner come with you to Canada?",
    info: "If they are not accompanying you, you earn points as if you were single.",
    type: 'yesno',
    condition: (p: UserProfile) => p.maritalStatus !== 'Single' && !p.spouseCanadian
  },
  {
    id: 'age',
    text: "How old are you?",
    info: "Maximum points are awarded between 20-29. Points drop significantly after 30 and hit 0 at age 45.",
    type: 'number'
  },
  {
    id: 'education',
    text: "What is your highest level of education?",
    info: "Include your Canadian credential or foreign credential (with ECA).",
    type: 'select',
    options: EDUCATION_OPTIONS_UI, 
    jargonId: 'ECA' // Jargon: ECA
  },
  {
    id: 'canadianEducation',
    text: "Did you obtain any of this education in Canada?",
    info: "Points are awarded for 1-2 year diplomas (15 pts) or degrees of 3+ years (30 pts).",
    type: 'select',
    options: ['None', '1or2Year', '3YearOrMore']
  },
  {
    id: 'english',
    text: "English Language Results (CLB)",
    subFields: ['Speaking', 'Listening', 'Reading', 'Writing'],
    info: "CLB 9 in all skills triggers massive 'Skill Transferability' bonuses.",
    type: 'multi-number',
    jargonId: 'CLB' // Jargon: CLB
  },
  {
    id: 'french',
    text: "French Language Results (NCLC/CLB)",
    subFields: ['Speaking', 'Listening', 'Reading', 'Writing'],
    info: "Score NCLC 7 in all four abilities to unlock 25 or 50 additional points.",
    type: 'multi-number',
    jargonId: 'CLB' // Jargon: CLB
  },
  {
    id: 'workCanada',
    text: "Years of skilled work experience IN Canada?",
    info: "Must be legal, paid, and in TEER 0, 1, 2, or 3.",
    type: 'number',
    jargonId: 'TEER' // Jargon: TEER
  },
  {
    id: 'workForeign',
    text: "Years of skilled work experience OUTSIDE Canada?",
    info: "Foreign experience boosts your score if combined with high language results.",
    type: 'number'
  },
  {
    id: 'certificateOfQualification',
    text: "Do you have a Certificate of Qualification in a trade?",
    info: "Issued by a Canadian province or federal body for tradespeople.",
    type: 'yesno'
  },
  {
    id: 'pnp',
    text: "Do you have a Provincial Nomination?",
    info: "Awards +600 points. Does not include simple 'interest letters'.",
    type: 'yesno',
    jargonId: 'PNP' // Jargon: PNP
  },
  {
    id: 'siblingInCanada',
    text: "Do you have a sibling in Canada (Citizen/PR)?",
    info: "Must be 18+ and living in Canada.",
    type: 'yesno'
  },
  // Spouse Factors Questions (Only if applicable)
  {
    id: 'spouseEducation',
    text: "What is your spouse's education level?",
    info: "Contributes up to 10 points.",
    type: 'select',
    options: EDUCATION_OPTIONS_UI, 
    jargonId: 'ECA', // Jargon: ECA
    condition: (p: UserProfile) => p.maritalStatus !== 'Single' && p.spouseAccompanying && !p.spouseCanadian
  },
  {
    id: 'spouseWorkInCanada',
    text: "Years of spouse's skilled work IN Canada?",
    info: "Contributes up to 10 points.",
    type: 'number',
    jargonId: 'TEER', // Jargon: TEER
    condition: (p: UserProfile) => p.maritalStatus !== 'Single' && p.spouseAccompanying && !p.spouseCanadian
  },
  {
    id: 'spouseEnglish',
    text: "Spouse's English Results (CLB)",
    subFields: ['Speaking', 'Listening', 'Reading', 'Writing'],
    info: "Contributes up to 20 points.",
    type: 'multi-number',
    jargonId: 'CLB', // Jargon: CLB
    condition: (p: UserProfile) => p.maritalStatus !== 'Single' && p.spouseAccompanying && !p.spouseCanadian
  },
  {
    id: 'category',
    text: "Primary Occupation Category",
    info: "Used for Category-Based Selection rounds.",
    type: 'select',
    options: ['None', 'Healthcare', 'STEM', 'Trades', 'Transport', 'Agriculture']
  }
];

// --- Main App Component ---
export default function App() {
  const [started, setStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [finished, setFinished] = useState(false);

  // Helper to find next valid question
  const getNextQuestionIndex = (startIndex: number, currentProfile: UserProfile) => {
    for (let i = startIndex; i < questions.length; i++) {
      if (!questions[i].condition || questions[i].condition(currentProfile)) {
        return i;
      }
    }
    return -1;
  };

  const handleNext = (val: any) => {
    const q = questions[currentQIndex];
    
    // Update State
    const updatedProfile: UserProfile = { ...profile };
    
    // Logic for mapping full description back to key for Education fields
    if (q.id === 'education' || q.id === 'spouseEducation') {
        const key = EDUCATION_MAP_REVERSE[val as string];
        if (q.id === 'education') updatedProfile.education = key;
        if (q.id === 'spouseEducation') updatedProfile.spouseEducation = key;
    } else {
        if (q.id === 'marital') updatedProfile.maritalStatus = val;
        if (q.id === 'spouseCheck') updatedProfile.spouseCanadian = val === 'Yes';
        if (q.id === 'spouseAccompany') updatedProfile.spouseAccompanying = val === 'Yes';
        if (q.id === 'age') updatedProfile.age = parseInt(val);
        if (q.id === 'canadianEducation') updatedProfile.canadianEducation = val;
        
        if (q.id === 'english') {
          updatedProfile.english = { 
            speak: parseInt(val[0]), listen: parseInt(val[1]), 
            read: parseInt(val[2]), write: parseInt(val[3]) 
          };
        }
        if (q.id === 'french') {
          updatedProfile.french = { 
            speak: parseInt(val[0]), listen: parseInt(val[1]), 
            read: parseInt(val[2]), write: parseInt(val[3]) 
          };
        }
        
        if (q.id === 'workCanada') updatedProfile.workInCanada = parseInt(val);
        if (q.id === 'workForeign') updatedProfile.workForeign = parseInt(val);
        if (q.id === 'certificateOfQualification') updatedProfile.certificateOfQualification = val === 'Yes';
        if (q.id === 'pnp') updatedProfile.pnp = val === 'Yes';
        if (q.id === 'siblingInCanada') updatedProfile.siblingInCanada = val === 'Yes';
        if (q.id === 'category') updatedProfile.category = val;
    
        // Spouse Updates
        if (q.id === 'spouseWorkInCanada') updatedProfile.spouseWorkInCanada = parseInt(val);
        if (q.id === 'spouseEnglish') {
          updatedProfile.spouseEnglish = {
            speak: parseInt(val[0]), listen: parseInt(val[1]), 
            read: parseInt(val[2]), write: parseInt(val[3]) 
          };
        }
    }


    setProfile(updatedProfile);

    // Navigate
    const nextIdx = getNextQuestionIndex(currentQIndex + 1, updatedProfile);
    if (nextIdx !== -1) {
      setCurrentQIndex(nextIdx);
    } else {
      setFinished(true);
    }
  };
  
  const handleRestart = () => {
    setStarted(false); // Go back to the LandingPage (Initial State)
    setCurrentQIndex(0); // Reset to first question
    setProfile(initialProfile); // Reset profile data
    setFinished(false); // Ensure quiz view is reset
  };


  if (!started) return <LandingPage onStart={() => setStarted(true)} />;
  if (finished) return <ResultPage profile={profile} onRestart={handleRestart} />;

  const q = questions[currentQIndex];
  const jargon = q.jargonId ? JARGON_MAP[q.jargonId] : null;

  return (
    // Updated background for "Build Canada" style
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-10 pb-10 px-4 font-sans">
      <div className="bg-white max-w-xl w-full p-6 rounded-xl shadow-2xl border border-gray-200">
        <div className="mb-3 text-sm font-bold text-red-700 uppercase tracking-widest flex justify-between items-center border-b pb-2">
          <span>Question {currentQIndex + 1} of {questions.filter(q => !q.condition || q.condition(profile)).length}</span>
          <span className="text-xl">🇨🇦</span>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{q.text}</h2>
        
        {/* CRITERIA Info Box */}
        <div className="bg-gray-100 text-gray-800 p-4 rounded-lg mb-4 text-sm leading-relaxed border-l-4 border-gray-400">
          <strong>CRITERIA:</strong> {q.info}
        </div>

        {/* JARGON Info Box (conditional) */}
        {jargon && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 text-sm leading-relaxed border border-red-200">
                <p className="font-bold">JARGON: {jargon.acronym} ({jargon.definition})</p>
                <p className="text-xs mt-1 text-red-700">{jargon.meaning}</p>
            </div>
        )}

        <QuestionInput q={q} onNext={handleNext} />
      </div>
    </div>
  );
}

// --- Helper Component for Inputs ---
const QuestionInput = ({ q, onNext }: { q: any, onNext: (val: any) => void }) => {
  const [val, setVal] = useState<any>(q.type === 'multi-number' ? [0,0,0,0] : '');

  const submit = () => onNext(val);

  if (q.type === 'select') {
    return (
      <div className="space-y-3">
        {q.options.map((opt: string) => (
          <button 
            key={opt}
            onClick={() => onNext(opt)}
            // Select button style
            className="w-full block text-left px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition text-gray-800 shadow-sm"
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  if (q.type === 'yesno') {
    return (
      <div className="flex space-x-4">
        {/* Yes/No button style */}
        <button onClick={() => onNext('Yes')} className="flex-1 bg-red-700 text-white py-3 rounded-lg hover:bg-red-800 font-bold shadow-md transition transform hover:scale-[1.01]">YES</button>
        <button onClick={() => onNext('No')} className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 font-bold shadow-md transition transform hover:scale-[1.01]">NO</button>
      </div>
    );
  }

  if (q.type === 'number') {
    return (
      <div>
        <input 
          type="number" 
          className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-lg focus:border-red-500 focus:ring-red-500 transition shadow-sm" 
          onChange={(e) => setVal(e.target.value)} 
          autoFocus
        />
        {/* Next button style */}
        <button onClick={submit} className="bg-gray-800 text-white py-3 px-6 rounded-lg hover:bg-gray-700 font-bold w-full shadow-md transition">NEXT STEP</button>
      </div>
    );
  }

  if (q.type === 'multi-number') {
    return (
      <div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {q.subFields.map((field: string, idx: number) => (
            <div key={field}>
              <label className="block text-sm font-bold mb-1 text-gray-700">{field}</label>
              <input 
                type="number" 
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-red-500 focus:ring-red-500 transition shadow-sm" 
                value={val[idx]}
                onChange={(e) => {
                  const newArr = [...val];
                  newArr[idx] = e.target.value;
                  setVal(newArr);
                }}
              />
            </div>
          ))}
        </div>
        {/* Next button style */}
        <button onClick={submit} className="w-full bg-gray-800 text-white py-3 rounded-lg hover:bg-gray-700 font-bold shadow-md transition">NEXT STEP</button>
      </div>
    );
  }

  return null;
};