import { Screen } from '@/components/screen';
import { Placeholder } from '@/components/ui/placeholder';
import { useT } from '@/i18n';

export default function ContributionsScreen() {
  const t = useT();
  return (
    <Screen title={t('mobile.tabs.contributions')}>
      <Placeholder icon="wallet-outline" />
    </Screen>
  );
}
