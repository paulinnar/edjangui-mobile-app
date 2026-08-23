import { Screen } from '@/components/screen';
import { Placeholder } from '@/components/ui/placeholder';
import { useT } from '@/i18n';

export default function MailboxScreen() {
  const t = useT();
  return (
    <Screen title={t('nav.mailbox')}>
      <Placeholder icon="chatbubbles-outline" />
    </Screen>
  );
}
