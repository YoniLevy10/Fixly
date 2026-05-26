import BottomNav from '@/components/BottomNav'

const categories = [
  '⚡ חשמלאי',
  '🚰 אינסטלטור',
  '❄️ מיזוג אוויר',
  '🧹 ניקיון',
  '🎨 צבעי',
  '🔑 מנעולן',
]

const professionals = [
  {
    name: 'יוסי כהן',
    category: 'אינסטלטור',
    rating: '4.8',
    reviews: 128,
    available: 'זמין עכשיו',
  },
  {
    name: 'אבי לוי',
    category: 'חשמלאי',
    rating: '4.9',
    reviews: 96,
    available: 'זמין עכשיו',
  },
  {
    name: 'מיכאל דוד',
    category: 'מיזוג אוויר',
    rating: '4.7',
    reviews: 74,
    available: 'זמין עכשיו',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F5F7FB] pb-32">
      <div className="mx-auto max-w-[430px]">
        <header className="px-5 pt-6 pb-4 bg-white border-b border-black/5 sticky top-0 z-40">
          <div className="flex items-center justify-between mb-4">
            <button className="w-11 h-11 rounded-full bg-[#F5F7FB] flex items-center justify-center text-xl">
              ☰
            </button>

            <div className="text-center">
              <h1 className="text-2xl font-bold text-[#111827]">
                שלום, דניאל 👋
              </h1>
              <div className="text-sm text-[#6B7280] mt-1">
                📍 תל אביב-יפו
              </div>
            </div>

            <button className="w-11 h-11 rounded-full bg-[#F5F7FB] flex items-center justify-center text-xl relative">
              🔔
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>
            </button>
          </div>
        </header>

        <main className="px-5 pt-5">
          <section className="bg-[#0B3B91] rounded-[28px] p-6 mb-6 overflow-hidden relative shadow-lg">
            <div className="relative z-10 text-right">
              <h2 className="text-white text-[34px] leading-[1.1] font-bold mb-3">
                זקוקים לתיקון?
              </h2>

              <p className="text-white/90 text-[18px] leading-relaxed mb-5">
                מצא את איש המקצוע המתאים
                במהירות ובקלות
              </p>

              <div className="bg-white rounded-2xl h-16 flex items-center px-5 text-[#9CA3AF] text-lg shadow-xl">
                🔎 מה צריך לתקן?
              </div>
            </div>
          </section>

          <section className="mb-8">
            <div className="flex items-center justify-between mb-5">
              <button className="text-[#2563EB] font-semibold text-sm">
                הצג הכל
              </button>

              <h3 className="text-[30px] font-bold text-[#111827]">
                בחרו קטגוריה
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <div
                  key={category}
                  className="bg-white rounded-[24px] h-[120px] shadow-sm border border-black/5 flex items-center justify-center text-[24px] font-semibold text-[#111827]"
                >
                  {category}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-5">
              <button className="text-[#2563EB] font-semibold text-sm">
                הצג הכל
              </button>

              <h3 className="text-[30px] font-bold text-[#111827]">
                אנשי מקצוע מומלצים
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              {professionals.map((professional) => (
                <div
                  key={professional.name}
                  className="bg-white rounded-[28px] p-5 shadow-sm border border-black/5"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-20 h-20 rounded-full bg-[#E5E7EB]"></div>

                    <div className="flex-1 text-right">
                      <h4 className="text-[22px] font-bold text-[#111827] mb-1">
                        {professional.name}
                      </h4>

                      <div className="text-[#6B7280] text-base mb-2">
                        {professional.category}
                      </div>

                      <div className="text-[#F59E0B] font-semibold">
                        ⭐ {professional.rating} ({professional.reviews})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button className="bg-[#2563EB] text-white h-12 px-6 rounded-2xl font-bold text-base shadow-lg">
                      בחר
                    </button>

                    <div className="text-[#16A34A] font-semibold text-base">
                      ● {professional.available}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
