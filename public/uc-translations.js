/**
 * Points the Usercentrics consent banner at the translations Termageddon hosts.
 *
 * This lived as an inline <script> in index.html. It was moved into a file so
 * the Content-Security-Policy never has to allow `unsafe-inline` for scripts —
 * that one allowance would undo most of what the policy is for, since it lets
 * any injected <script> run too.
 *
 * `uc` is defined by the consent-manager loader above it in the document.
 */
window.uc?.setCustomTranslations?.('https://termageddon.ams3.cdn.digitaloceanspaces.com/translations/');
