import { StepperField, type StepperFieldProps } from '@/components/ui/StepperField'

export interface QtyStepperProps extends StepperFieldProps {}

/**
 * Komponen domain QtyStepper untuk pencatatan kunjungan fisik di warung mitra.
 */
export function QtyStepper(props: QtyStepperProps) {
  return <StepperField {...props} />
}

export default QtyStepper
