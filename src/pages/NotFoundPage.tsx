import { ButtonLink } from '@/components/common/ButtonLink'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'

export function NotFoundPage() {
  return (
    <PageTransition>
      <div className="page-shell">
        <EmptyState
          title="Page not found"
          description="The route you tried to open does not exist in this SwapNet build."
          action={
            <ButtonLink to="/" variant="outline">
              Back home
            </ButtonLink>
          }
        />
      </div>
    </PageTransition>
  )
}
