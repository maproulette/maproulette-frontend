import { describe, expect, it } from 'vitest'
import type { TranslateFn } from '@/i18n'
import { buildBreadcrumbSegments, buildTitle } from './SectionHeader.tsx'

const t: TranslateFn = (_id, _values, defaultMessage) => defaultMessage ?? _id

describe('buildBreadcrumbSegments', () => {
  it('returns an empty array when the pathname is exactly the base path', () => {
    expect(buildBreadcrumbSegments('/manage', '/manage', 'create & manage', t)).toEqual([])
    expect(buildBreadcrumbSegments('/manage/', '/manage', 'create & manage', t)).toEqual([])
  })

  it('resolves known entity segments via the ENTITY_LIST_ROUTES lookup table', () => {
    expect(buildBreadcrumbSegments('/manage/project/5', '/manage', 'create & manage', t)).toEqual([
      { label: 'create & manage', href: '/manage' },
      { label: 'projects', href: '/manage/projects' },
      { label: '5', href: '/manage/project/5' },
    ])

    expect(
      buildBreadcrumbSegments('/manage/challenge/12', '/manage', 'create & manage', t)
    ).toEqual([
      { label: 'create & manage', href: '/manage' },
      { label: 'challenges', href: '/manage/challenges' },
      { label: '12', href: '/manage/challenge/12' },
    ])

    expect(buildBreadcrumbSegments('/manage/task/99', '/manage', 'create & manage', t)).toEqual([
      { label: 'create & manage', href: '/manage' },
      { label: 'tasks', href: '/manage/tasks' },
      { label: '99', href: '/manage/task/99' },
    ])
  })

  it('special-cases a trailing "new" segment to the localized "create" label', () => {
    expect(buildBreadcrumbSegments('/manage/project/new', '/manage', 'create & manage', t)).toEqual(
      [
        { label: 'create & manage', href: '/manage' },
        { label: 'projects', href: '/manage/projects' },
        { label: 'create', href: '/manage/project/new' },
      ]
    )
  })

  it('passes through unrecognized segments verbatim as both label and href suffix', () => {
    expect(buildBreadcrumbSegments('/manage/foo', '/manage', 'create & manage', t)).toEqual([
      { label: 'create & manage', href: '/manage' },
      { label: 'foo', href: '/manage/foo' },
    ])
  })

  it('strips a different basePath correctly (e.g. super-admin), but entity route hrefs are always under /manage', () => {
    // ENTITY_LIST_ROUTES paths are hardcoded to /manage/*, independent of basePath.
    expect(
      buildBreadcrumbSegments('/super-admin/challenge/3', '/super-admin', 'super admin', t)
    ).toEqual([
      { label: 'super admin', href: '/super-admin' },
      { label: 'challenges', href: '/manage/challenges' },
      { label: '3', href: '/super-admin/challenge/3' },
    ])
  })

  it('accumulates currentPath across multiple non-entity segments', () => {
    expect(buildBreadcrumbSegments('/manage/foo/bar', '/manage', 'create & manage', t)).toEqual([
      { label: 'create & manage', href: '/manage' },
      { label: 'foo', href: '/manage/foo' },
      { label: 'bar', href: '/manage/foo/bar' },
    ])
  })
})

describe('buildTitle', () => {
  it('returns the dynamicTitle immediately when provided, ignoring everything else', () => {
    expect(
      buildTitle('/manage/project/5', '/manage', 'Static', 'Dynamic Title', 'Fallback', t)
    ).toBe('Dynamic Title')
  })

  it('appends the numeric id from the pathname to a staticTitle for project/challenge/task routes', () => {
    expect(buildTitle('/manage/project/5', '/manage', 'Project', null, 'Fallback', t)).toBe(
      'Project 5'
    )
    expect(buildTitle('/manage/challenge/12', '/manage', 'Challenge', null, 'Fallback', t)).toBe(
      'Challenge 12'
    )
    expect(buildTitle('/manage/task/99', '/manage', 'Task', null, 'Fallback', t)).toBe('Task 99')
  })

  it('returns staticTitle unchanged when the pathname has no matching digit-suffixed entity route', () => {
    expect(buildTitle('/manage/projects', '/manage', 'Projects', null, 'Fallback', t)).toBe(
      'Projects'
    )
    expect(buildTitle('/manage/project/new', '/manage', 'Project', null, 'Fallback', t)).toBe(
      'Project'
    )
  })

  it('falls back to the fallbackTitle when rest of the path is empty and there is no staticTitle', () => {
    expect(buildTitle('/manage', '/manage', undefined, null, 'Fallback', t)).toBe('Fallback')
    expect(buildTitle('/manage/', '/manage', undefined, null, 'Fallback', t)).toBe('Fallback')
  })

  it('title-cases each remaining path segment when there is no staticTitle', () => {
    expect(buildTitle('/manage/foo/bar', '/manage', undefined, null, 'Fallback', t)).toBe('Foo Bar')
  })

  it('special-cases a "new" segment to the localized capitalized "Create" label', () => {
    expect(buildTitle('/manage/project/new', '/manage', undefined, null, 'Fallback', t)).toBe(
      'Project Create'
    )
  })
})
