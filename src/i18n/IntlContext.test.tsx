/**
 * @vitest-environment happy-dom
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { IntlProvider, useIntl } from './IntlContext'

const RichSentence = () => {
  const { t } = useIntl()
  return (
    <p>
      {t(
        {
          id: 'test.richSentence',
          defaultMessage:
            'Or go to <link>Projects</link> to find {count, plural, one {# challenge} other {# challenges}}',
        },
        { count: 2, link: (chunks) => <a href="/projects">{chunks}</a> }
      )}
    </p>
  )
}

const Amount = ({ value }: { value: number }) => {
  const { formatNumber } = useIntl()
  return <>{formatNumber(value)}</>
}

describe('IntlProvider', () => {
  it('renders a rich-text message as one sentence with its elements in place', () => {
    expect(
      renderToStaticMarkup(
        <IntlProvider initialLocale="en-US">
          <RichSentence />
        </IntlProvider>
      )
    ).toBe('<p>Or go to <a href="/projects">Projects</a> to find 2 challenges</p>')
  })

  it('formats numbers for the chosen language', () => {
    const render = (locale: 'en-US' | 'de') =>
      renderToStaticMarkup(
        <IntlProvider initialLocale={locale}>
          <Amount value={1234.5} />
        </IntlProvider>
      )
    expect(render('en-US')).toBe('1,234.5')
    expect(render('de')).toBe('1.234,5')
  })
})
