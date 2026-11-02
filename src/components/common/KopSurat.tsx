import React from 'react';
import { useSchool } from '../../contexts/SchoolContext';

interface KopSuratProps {
  className?: string;
  isCompact?: boolean;
}

export const KopSurat: React.FC<KopSuratProps> = ({ className = '', isCompact = false }) => {
  const { schoolProfile } = useSchool();

  const logoKiri = schoolProfile?.logoKiriUrl || '/logo_jember.png';
  const logoKanan = schoolProfile?.logoKananUrl || schoolProfile?.logoUrl || '/logo_sd.png';

  const line1 = schoolProfile?.kopLine1 || 'PEMERINTAH KABUPATEN JEMBER';
  const line2 = schoolProfile?.kopLine2 || 'DINAS PENDIDIKAN';
  const line3 = schoolProfile?.kopLine3 || 'SEKOLAH DASAR NEGERI KESILIR 02';
  const line4 = schoolProfile?.kopLine4 || 'KECAMATAN WULUHAN';
  const line5 = schoolProfile?.kopLine5 || 'JL. Ambulu No. 91 Kesilir Wuluhan Kode Pos 68162';

  return (
    <div className={`w-full text-black select-none ${className}`}>
      <div className="flex items-center justify-between gap-4 pb-2">
        {/* Logo Kiri (Kabupaten Jember) */}
        <div className="w-20 md:w-24 shrink-0 flex items-center justify-center">
          <img
            src={logoKiri}
            alt="Logo Kabupaten Jember"
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
          />
        </div>

        {/* Teks Identitas Kop Surat */}
        <div className="text-center flex-1 leading-tight px-1">
          <h4 className="font-bold text-xs md:text-sm tracking-wider uppercase text-black">
            {line1}
          </h4>
          <h3 className="font-bold text-sm md:text-base tracking-wider uppercase text-black">
            {line2}
          </h3>
          <h2 className="font-extrabold text-base md:text-xl tracking-wide uppercase text-black font-serif my-0.5">
            {line3}
          </h2>
          <h4 className="font-bold text-xs md:text-sm tracking-wider uppercase text-black">
            {line4}
          </h4>
          <p className="text-[10px] md:text-xs text-black italic font-normal mt-0.5">
            {line5}
          </p>
        </div>

        {/* Logo Kanan (Logo SD) */}
        <div className="w-20 md:w-24 shrink-0 flex items-center justify-center">
          <img
            src={logoKanan}
            alt="Logo SD"
            className="w-16 h-16 md:w-20 md:h-20 object-contain"
          />
        </div>
      </div>

      {/* Garis Ganda Kop Surat Resmi (Tebal Tipis) */}
      <div className="w-full border-t-[3px] border-black pt-[1.5px]">
        <div className="w-full border-t border-black mb-3" />
      </div>
    </div>
  );
};
