/**
 * The English catalogue, and the source of truth for the key set.
 *
 * `de.ts` is typed against these keys, so a string added here without a German
 * translation is a compile error rather than an English word in a German app.
 *
 * Keys ending in `_one` / `_other` are plural forms picked by `Intl.PluralRules`
 * whenever `count` is passed; `{name}` placeholders are filled from the same
 * object.
 */
export const en = {
	'app.name': 'E-Paper Studio',
	'app.loading': 'Loading…',
	'app.crashed': 'Something went wrong',
	'app.crashedEngine': 'Web engine: {engine}',
	'app.crashedHint':
		'The app hit an error it could not recover from. Restart it; if this keeps happening, please report the message below.',
	'app.language': 'App language',
	'app.theme': 'Theme',
	'theme.system': 'Follow the system',
	'app.builtBy': 'Built by',
	'app.authorTitle': 'Open {name} in your browser',

	'nav.setup': 'Setup',
	'nav.birthdays': 'Birthdays',
	'nav.events': 'Holidays',
	'nav.photos': 'Photos',
	'nav.chores': 'Chores',

	'chores.eyebrow': 'Chores',
	'chores.add.title': 'Add a chore',
	'chores.add.description':
		'The first day sets both the rhythm and the turn order — a weekly chore starting on a Tuesday is due every Tuesday, and the first person listed takes that first turn.',
	'chores.namePlaceholder': 'Bins out',
	'chores.people': 'Who takes turns',
	'chores.people.placeholder': 'Add a name and press Enter',
	'chores.people.hint': 'In turn order. Leave empty for a job nobody is assigned.',
	'chores.frequency': 'How often',
	'chores.firstDay': 'First time',
	'chores.list.title': 'Chores ({count})',
	'chores.list.description': 'Each page shows the ones due that day, and whose turn it is.',
	'chores.empty': 'No chores yet. Add one above and the pages will say who is doing what.',
	'chores.nobody': 'nobody assigned',
	'chores.nextTurn': 'Next: {date} · {person}',
	'chores.nextTurnUnassigned': 'Next: {date}',
	'chores.noneDue': 'Not due in the next year.',
	'chores.maxOnPage': 'Chores per page',
	'chores.maxOnPage.hint': 'Zero leaves chores off the pages entirely.',

	'frequency.daily': 'Every day',
	'frequency.weekly': 'Every week',
	'frequency.fortnightly': 'Every two weeks',
	'frequency.monthly': 'Every month',

	'io.export.choresCsv': 'Chores · CSV',
	'io.export.choresJson': 'Chores · JSON',
	'io.summary.chores_one': '{count} chore',
	'io.summary.chores_other': '{count} chores',
	'nav.export': 'Export',
	'nav.device': 'Display',

	'project.open': 'Open',
	'project.openTitle': 'Open a saved project',
	'project.openDialog': 'Open project',
	'project.save': 'Save',
	'project.saveTitle': 'Save a copy of this project',
	'project.saveDialog': 'Save project',
	'project.fileType': 'E-Paper Studio project',

	'action.add': 'Add',
	'action.remove': 'Remove',
	'action.cancel': 'Cancel',
	'action.search': 'Search…',
	'action.moveUp': 'Move up',
	'action.moveDown': 'Move down',

	'field.name': 'Name',

	'setup.eyebrow': 'Setup',
	'setup.display.title': 'Display',
	'setup.display.description':
		'Pick the panel you have. Everything on the page is positioned from these numbers, so the layout follows along.',
	'setup.width': 'Width (px)',
	'setup.height': 'Height (px)',

	'setup.range.title': 'Date range',
	'setup.range.description': 'One page per day, starting on the day you choose.',
	'setup.firstDay': 'First day',
	'setup.days': 'Days to cover',
	'setup.pages_one': '{count} page will be written',
	'setup.pages_other': '{count} pages will be written',
	'setup.collapse.label': 'Give a trip or holiday a single page',
	'setup.collapse.hint': 'A nine-day trip shows up once instead of filling nine pages.',

	'setup.language.title': 'Calendar language',
	'setup.language.description':
		'Weekday names, month names and the countdown printed on the pages. The app’s own language is set in the top bar.',
	'setup.locale': 'Language',
	'setup.weekStart': 'Week starts on',
	'setup.weekStart.monday': 'Monday',
	'setup.weekStart.sunday': 'Sunday',

	'setup.template.title': 'Page design',
	'setup.template.description': 'How a page is laid out. The preview follows your choice.',
	'setup.template.note':
		'The five panel designs are composed for a portrait 480 × 800 panel and are scaled to fit any other size. They show the date, the events and the month — chores appear on the original layout only.',
	'template.classic': 'Original',
	'template.classic.hint': 'Day tile, event list, chores and a month grid.',
	'template.masthead': 'Masthead',
	'template.masthead.hint':
		'The date leads, events follow as a ruled list, month grid at the foot.',
	'template.ledger': 'Ledger',
	'template.ledger.hint': 'An outlined numeral over a Date / Entry / Left table.',
	'template.tiles': 'Tiles',
	'template.tiles.hint': 'A square date tile beside today’s summary, then one card per event.',
	'template.poster': 'Poster',
	'template.poster.hint': 'One huge numeral, with the next entries in a footer band.',
	'template.agenda': 'Agenda',
	'template.agenda.hint': 'Date and entries only — no month grid.',

	'setup.appearance.title': 'Appearance',
	'setup.appearance.description':
		'The panel can only show seven colours, so the accent is picked from those.',
	'setup.accent': 'Accent colour',
	'setup.font': 'Font',
	'setup.font.bundled': '{name} (bundled)',
	'setup.maxEvents': 'Events per page',
	'setup.lookahead': 'Look ahead (days)',
	'setup.lookahead.hint': 'How far out upcoming birthdays are listed.',
	'setup.showAges': 'Show ages',

	'color.red': 'Red',
	'color.orange': 'Orange',
	'color.green': 'Green',
	'color.blue': 'Blue',
	'color.black': 'Black',

	'birthdays.eyebrow': 'Birthdays',
	'birthdays.add.title': 'Add a birthday',
	'birthdays.add.description': 'The year of birth is what puts an age under the name.',
	'birthdays.namePlaceholder': 'Alex',
	'birthdays.dateOfBirth': 'Date of birth',
	'birthdays.list.title': 'Birthdays ({count})',
	'birthdays.list.description': 'Sorted by whichever is coming up next.',
	'birthdays.empty': 'No birthdays yet. Add one above, or import a file you already have.',

	'events.eyebrow': 'Holidays',
	'events.add.title': 'Add a holiday or trip',
	'events.add.description':
		'Pages count down to it. Anything lasting more than a day gets one page rather than one per day.',
	'events.namePlaceholder': 'Crete',
	'events.firstDay': 'First day',
	'events.days': 'Days',
	'events.list.title': 'Holidays and trips ({count})',
	'events.empty':
		'Nothing planned yet. Add a trip above, or import the .ics file your calendar app exports.',

	'badge.today': 'today',
	'badge.past': 'past',
	'badge.inDays': 'in {count} d',

	'photos.eyebrow': 'Photos',
	'photos.list.title': 'Photos ({count})',
	'photos.list.description':
		'Any picture you add is resized to the panel and dithered to its seven colours on the way to the card.',
	'photos.add': 'Add photos',
	'photos.addDialog': 'Add photos',
	'photos.imageFilter': 'Images',
	'photos.empty': 'No photos yet — the card will hold calendar pages only.',
	'photos.settings.description': 'How this picture is fitted to the panel.',
	'photos.fit': 'Fit',
	'photos.fit.cover': 'Fill the page, crop the rest',
	'photos.fit.contain': 'Fit the whole picture, pad with white',
	'photos.autoRotate': 'Turn sideways photos to match the panel',
	'photos.dither': 'Dither',
	'photos.dither.hint':
		'Mixes the seven available colours so photographs keep their shading. Turn it off for flat graphics.',
	'photos.unreadable': 'Could not read this file.',
	'photos.converting': 'Converting…',

	'export.eyebrow': 'Export',
	'export.where.title': 'Where to write',
	'export.where.description':
		'Point this at the SD card. The app creates a pic folder and a fileList.txt next to it — the layout the display expects.',
	'export.chooseFolder': 'Choose folder',
	'export.chooseFolderDialog': 'Choose the SD card (or any folder)',
	'export.noFolder': 'Nothing chosen yet',
	'export.clear.label': 'Clear the card first',
	'export.clear.hint':
		'Removes the old pictures, fileList.txt and the index file the display leaves behind. Skipping this step is the usual reason a card still shows last month.',
	'export.what.title': 'What to write',
	'export.contents': 'Contents',
	'export.contents.calendar': 'Calendar pages only ({count})',
	'export.contents.photos': 'Photos only ({count})',
	'export.contents.both': 'Calendar pages and photos ({count})',
	'export.placement': 'Where photos go',
	'export.placement.append': 'After the calendar pages',
	'export.placement.interleave': 'Spread between the pages',
	'export.tooMany':
		'{count} pictures is more than the {max} the display is documented to handle. Shorten the date range or drop a few photos.',
	'export.generate.title': 'Generate',
	'export.run_one': 'Generate {count} picture',
	'export.run_other': 'Generate {count} pictures',
	'export.working': 'Working…',
	'export.openFolder': 'Open folder',
	'export.progress': '{done} / {total} — {label}',
	'export.starting': 'Starting…',
	'export.done_one': 'Done. {count} picture written, plus {path}.',
	'export.done_other': 'Done. {count} pictures written, plus {path}.',

	'device.eyebrow': 'Display',
	'device.card.title': 'Putting the card back',
	'device.card.description':
		'The display keeps its own bookkeeping on the card, so the order matters.',
	'device.card.step1': 'Take the SD card out of the display.',
	'device.card.step2': 'Generate onto it from the Export tab, with “Clear the card first” on.',
	'device.card.step3': 'Put the card back in.',
	'device.card.step4': 'Press the button next to the stand to restart the display.',
	'device.card.step5': 'Press it again to step to the next picture.',
	'device.card.note':
		'Pictures have to sit in the pic folder — the display ignores any other subfolder — and fileList.txt at the root decides the order. Both are written for you.',
	'device.firmware.title': 'How often it turns the page',
	'device.firmware.description':
		'The interval is firmware, not a setting. Copy one of these onto the board to change it.',
	'device.firmware.step1': 'Hold RUN, then press BOOT, release RUN, then release BOOT.',
	'device.firmware.step2': 'A drive called RPI-RP2 appears on your computer.',
	'device.firmware.step3': 'Pick the interval below and choose that drive.',
	'device.firmware.none': 'No firmware images are bundled with this build.',
	'device.firmware.every': 'Every {count} hours',
	'device.firmware.dialog': 'Choose the RPI-RP2 drive',
	'device.firmware.copied': 'Copied to {path}. The board restarts on its own.',
	'device.firmware.note':
		'Automatic refresh has to be switched on at the display for the interval to have any effect. With a 24-hour interval and one page per day, the calendar keeps step with the real date.',

	/**
	 * Text printed on the panel itself.
	 *
	 * These are picked with the *calendar* language (the `locale` setting), not
	 * the app language, so a German calendar reads German however the app is set.
	 */
	'page.comingUp': 'Coming up',
	'page.ahead': 'Ahead',
	'page.nextEntries': 'Next entries',
	'page.nextUp': 'Next up',
	'page.today': 'Today',
	'page.noEventsToday': 'Nothing on today',
	'page.entriesThisMonth_one': '{count} entry this month',
	'page.entriesThisMonth_other': '{count} entries this month',
	'page.birthdayToday': 'Birthday today',
	'page.happyBirthday': 'Happy birthday {name}',
	'page.birthday': 'Birthday',
	'page.holiday': 'Holiday',
	'page.turns': 'turns {age}',
	'page.is': 'is {age}',
	'page.born': 'born {date}',
	'page.bornYears': 'born {year} · {count} years',
	'page.yearsToday': 'years today',
	'page.week': 'Week {count}',
	'page.dayOfYear': 'Day {day} / {total}',
	'page.column.date': 'Date',
	'page.column.entry': 'Entry',
	'page.column.left': 'Left',
	'page.inDays': 'in {count} d',
	'page.onTheDay': 'today',

	'preview.title': 'Preview',
	'preview.previous': 'Previous page',
	'preview.next': 'Next page',
	'preview.pixels': '{width} × {height} px, actual pixels',
	'preview.page': 'page {index} of {total}',
	'preview.empty':
		'No pages in this range. Check the first day and the number of days on the Setup tab.',

	'io.import': 'Import',
	'io.importTitle': 'Import birthdays, holidays and chores from one file',
	'io.export.menu': 'Export',
	'io.exportTitle': 'Export birthdays, holidays and chores',
	'io.importDialog': 'Import calendar data',
	'io.exportDialog': 'Export calendar data',
	'io.filter.any': 'Calendar data (JSON, CSV, ICS)',
	'io.filter.all': 'All files',
	'io.export.birthdaysCsv': 'Birthdays · CSV',
	'io.export.birthdaysJson': 'Birthdays · JSON',
	'io.export.eventsCsv': 'Holidays · CSV',
	'io.export.eventsJson': 'Holidays · JSON',
	'io.export.allJson': 'Everything · JSON',
	'io.export.allCsv': 'Everything · CSV',
	'io.export.allIcs': 'Everything · ICS',
	'io.nothingFound': 'No birthdays, holidays or chores were found in that file.',
	'io.merge.title': 'Import {summary}',
	'io.merge.question': 'Add these to what is already here, or replace it?',
	'io.merge.append': 'Add to the list',
	'io.merge.replace': 'Replace the list',
	'io.merge.current': 'You currently have {summary}.',
	'io.summary.birthdays_one': '{count} birthday',
	'io.summary.birthdays_other': '{count} birthdays',
	'io.summary.events_one': '{count} holiday',
	'io.summary.events_other': '{count} holidays',
	'io.summary.and': '{first} and {second}',
	'io.summary.none': 'nothing',
	'io.imported': 'Imported {summary}.',
} as const

export type MessageKey = keyof typeof en
