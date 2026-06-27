import {
  DocumentProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";

export default function Document(props: DocumentProps) {
  // The race-weekend experience (full-bleed, always dark) is served at both
  // `/` and `/v2`; apply its body class during SSR so the first paint isn't
  // briefly squeezed into the classic site's narrow column.
  const page = props.__NEXT_DATA__?.page;
  const isV2 = page === "/" || page === "/v2";
  // /alarm is the Leave House Alarm PWA — full-bleed, always-dark app shell.
  const isApp = page === "/alarm";
  const bodyClass = isApp ? "app-dark" : isV2 ? "v2" : undefined;
  return (
    <Html lang="en">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@200;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className={bodyClass}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
