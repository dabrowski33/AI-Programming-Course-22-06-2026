import ComplaintReturnForm from "@/components/form/ComplaintReturnForm"

const appTitle =
  process.env.NEXT_PUBLIC_APP_TITLE ?? "Hardware Service Decision Copilot"

export default function FormPage() {
  return (
    <main className="flex flex-1 flex-col items-center py-10 px-4 bg-zinc-50">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {appTitle}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Wypełnij formularz, aby uzyskać decyzję serwisową
          </p>
        </div>
        <ComplaintReturnForm />
      </div>
    </main>
  )
}
