import Alert from '../../components/alerts/Alert'
import Breadcrumb from '../../layouts/Breadcrumb'

export default function ProspectFormPage() {
  return (
    <div className="max-w-xl space-y-4">
      <Breadcrumb crumbs={[{ label: 'Prospects', to: '/prospects' }, { label: 'New Prospect' }]} />
      {/* TODO: Wire to POST prospects once confirmed */}
      <Alert type="info" message="Prospect creation form — wire to POST prospects when endpoint shape is confirmed." />
    </div>
  )
}
