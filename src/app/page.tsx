export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/15">
          <span className="text-2xl font-bold text-accent">K</span>
        </div>
        <h1 className="text-xl font-semibold text-text-primary">
          KYC Monaco
        </h1>
        <p className="max-w-sm text-sm text-text-secondary">
          Plateforme KYC/AML pour les entités réglementées de Monaco
        </p>
      </div>
    </div>
  );
}
