import * as Sentry from '@sentry/nextjs';
import Error from 'next/error';
import type { NextPageContext } from 'next';

// Pages-Router error page — reports the error to Sentry, then renders Next's
// default error UI (errors are rare; a custom-styled 500 is out of scope).
function CustomErrorPage({ statusCode }: { statusCode: number }) {
  return <Error statusCode={statusCode} />;
}

CustomErrorPage.getInitialProps = async (context: NextPageContext) => {
  await Sentry.captureUnderscoreErrorException(context);
  return Error.getInitialProps(context);
};

export default CustomErrorPage;
