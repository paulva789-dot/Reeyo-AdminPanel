import Card from './Card';
import EmptyState from './EmptyState';
import { useAppState } from '../../state/useAppState';

interface NoEndpointProps {
  /** The feature, named as the screen names it. */
  what: string;
  /** What an admin cannot do because of it. One sentence. */
  consequence: string;
  /** The seeded rehearsal, shown in sample mode only. */
  children: React.ReactNode;
}

/**
 * A feature admin-api has no route for.
 *
 * This replaces an earlier notice that annotated seeded rows with "nothing you
 * change here is saved" and then showed them anyway. That was honest wording
 * around a dishonest screen: in live mode, next to columns of real figures,
 * invented rider loads and invented campaign spend read as platform data no
 * matter what the banner above them says. Nobody reads the banner twice.
 *
 * So the rule is now simple — **seed rows appear in sample mode and nowhere
 * else.** In live mode this says what is missing and what it costs, which is
 * information an admin can act on, rather than numbers they cannot.
 */
export default function NoEndpoint({ what, consequence, children }: NoEndpointProps) {
  const { isSample } = useAppState();

  // Sample mode is explicitly a rehearsal, and the page already carries a
  // banner saying so, so the seeded version is exactly what belongs here.
  if (isSample) return <>{children}</>;

  return (
    <Card>
      <EmptyState
        heading={`${what} is not on the admin API`}
        line={`${consequence} There is no route to read or write it, so this console
          shows nothing here rather than a figure it invented.`.replace(/\s+/g, ' ')}
      />
    </Card>
  );
}
