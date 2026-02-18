"use client";

export function Header() {
  return (
    <header className="mt-4 w-full px-4 md:mt-6">
      <div className="mx-auto w-full max-w-[700px] overflow-hidden rounded-[40px] border border-zinc-700 bg-zinc-900 px-6 py-10 shadow-2xl md:min-h-[168px] md:px-8 md:py-12">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-3xl font-bold text-zinc-100 md:text-4xl">
            <span aria-hidden="true">🎱</span>
            <span>Шаровня</span>
          </div>

          <div className="ml-auto rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2">
            <button
              type="button"
              onClick={() => console.log("login click")}
              className="rounded-lg bg-emerald-600 px-5 py-2 font-medium text-white transition duration-200 hover:bg-emerald-500 active:scale-[0.98]"
            >
              Войти
            </button>
          </div>
        </div>

        <p className="mt-3 text-zinc-400">Колхозный бильярд — калькулятор игры</p>
      </div>
    </header>
  );
}
