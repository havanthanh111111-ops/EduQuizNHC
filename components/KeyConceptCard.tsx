import React from 'react';
import { Lightbulb, BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import LatexText from './LatexText';

interface KeyConceptCardProps {
  keyConcept?: string;
  lessonUrl?: string;
  lessonTitle?: string;
  onOpenLesson?: (url: string, title?: string) => void;
  className?: string;
}

export default function KeyConceptCard({
  keyConcept,
  lessonUrl,
  lessonTitle,
  onOpenLesson,
  className = ''
}: KeyConceptCardProps) {
  const hasConcept = Boolean(keyConcept && keyConcept.trim());
  const hasLesson = Boolean(lessonUrl && lessonUrl.trim());

  if (!hasConcept && !hasLesson) return null;

  const displayTitle = lessonTitle?.trim() || 'Bài học liên quan (SGK)';

  const handleLessonAction = () => {
    if (!lessonUrl) return;
    if (onOpenLesson) {
      onOpenLesson(lessonUrl.trim(), displayTitle);
    } else {
      window.open(lessonUrl.trim(), '_blank', 'noopener,noreferrer');
    }
  };

  // Trường hợp có cả Khung trọng tâm (keyConcept)
  if (hasConcept) {
    return (
      <div className={`mt-5 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-amber-50/30 p-5 shadow-sm relative overflow-hidden ${className}`}>
        {/* Background accent */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-200/40 rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Lightbulb size={16} />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                Kiến thức trọng tâm cần nhớ
                <Sparkles size={12} className="text-amber-600 animate-pulse" />
              </h4>
              <p className="text-[10px] text-amber-700 font-semibold">
                Công thức & định lý cốt lõi của câu hỏi
              </p>
            </div>
          </div>

          {hasLesson && (
            <button
              type="button"
              onClick={handleLessonAction}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95 shrink-0"
              title="Mở toàn bộ bài giảng trên hệ thống học tập Vercel"
            >
              <BookOpen size={14} />
              <span className="truncate max-w-[220px]">
                {lessonTitle ? `Bài học: ${lessonTitle}` : 'Xem bài học SGK'}
              </span>
              <ExternalLink size={12} className="opacity-80 shrink-0" />
            </button>
          )}
        </div>

        {/* Nội dung công thức trọng tâm */}
        <div className="text-slate-800 text-sm font-semibold leading-relaxed bg-white/80 p-3.5 rounded-xl border border-amber-200/70 shadow-xs relative z-10">
          <LatexText text={keyConcept!} />
        </div>
      </div>
    );
  }

  // Trường hợp chỉ có nút liên kết bài học (không có văn bản trọng tâm)
  return (
    <div className={`mt-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <BookOpen size={16} />
        </div>
        <div>
          <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider">Tài liệu học tập bổ trợ</span>
          <p className="text-xs font-bold text-slate-800 line-clamp-1">{displayTitle}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleLessonAction}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 shrink-0"
      >
        <span>Mở bài học chi tiết</span>
        <ExternalLink size={13} />
      </button>
    </div>
  );
}
