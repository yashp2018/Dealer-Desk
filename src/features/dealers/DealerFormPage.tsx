import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'

export default function DealerFormPage() {
  return (
    <div className="max-w-xl space-y-4">
      <Breadcrumb crumbs={[{ label: 'Dealers', to: '/dealers' }, { label: 'New Dealer' }]} />
      {/* TODO: Wire to POST dealers once the API endpoint is available */}
      <Alert type="info" message="Dealer creation is not yet available via the API. This form will be enabled once the endpoint is added." />
    </div>
  )
}
