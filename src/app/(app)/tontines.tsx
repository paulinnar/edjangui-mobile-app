import { Screen } from '@/components/screen';
import { Placeholder } from '@/components/ui/placeholder';
import { useT } from '@/i18n';

export default function TontinesScreen() {
  const t = useT();
  return (
    <Screen title={t('nav.tontines')}>
      <Placeholder icon="people-outline" />
    </Screen>
  );
}
