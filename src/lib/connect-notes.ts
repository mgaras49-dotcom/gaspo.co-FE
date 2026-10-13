/**
 * Setup notes shown in the connect dialog, for apps that need something from
 * the user before Pipedream's popup can succeed. Shopify is the case that
 * prompted it: both of its connectors need a custom app the store owner creates
 * first, and without warning people hit a form asking for a Client ID they
 * have never heard of.
 */
export type ConnectNote = {
  title: string;
  body: string;
  link?: { label: string; href: string };
};

const SHOPIFY_CUSTOM_APP_HELP =
  "https://help.shopify.com/en/manual/apps/install-setup-apps#create-and-install-a-custom-app";

const NOTES: Record<string, ConnectNote> = {
  shopify: {
    title: "Shopify needs a custom app first",
    body:
      "Shopify only lets outside tools in through a custom app you create for your store. In the " +
      "Shopify Dev Dashboard, create an app, paste in the redirect URL shown on the next screen, " +
      "choose what Gaspo may read (orders, products, customers) and install it on your store. To " +
      "let Gaspo create or edit products and store pages, also give it write access to products " +
      "and content. " +
      'Then enter your shop ID (the "acme-co" in acme-co.myshopify.com) and the app\'s Client ID ' +
      "and Client Secret.",
    link: { label: "Shopify's guide to custom apps", href: SHOPIFY_CUSTOM_APP_HELP },
  },
  shopify_developer_app: {
    title: "This option needs an Admin API token",
    body:
      "It connects with an Admin API access token from a custom app in your store, which you " +
      'generate yourself. If that sounds unfamiliar, the plain "Shopify" option is the easier way ' +
      "in.",
    link: { label: "Shopify's guide to custom apps", href: SHOPIFY_CUSTOM_APP_HELP },
  },
};

/** The setup note for an app, or null when it connects without preparation. */
export function connectNoteFor(appSlug: string | null | undefined): ConnectNote | null {
  return (appSlug && NOTES[appSlug]) || null;
}
