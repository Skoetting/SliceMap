import {
  parseResolumeScreenSetupXml,
  ResolumeXmlImportError,
} from '../model/importResolumeXml'
import { createDefaultProject } from '../model/project'
import {
  isRectangularQuad,
  rectFromRectangularQuad,
} from '../model/rectFromQuad'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

/** Mirrors fixtures/resolume-screensetup-sample.xml (kept in-repo for docs). */
const FIXTURE_XML = `<?xml version="1.0" encoding="utf-8"?>
<XmlState name="SliceMapFixture">
	<ScreenSetup name="ScreenSetup">
		<CurrentCompositionTextureSize name="0:1" width="1920" height="1080"/>
		<screens>
			<Screen name="LED Wall" uniqueId="1001">
				<layers>
					<Slice uniqueId="2001">
						<Params name="Common">
							<Param name="Name" default="Layer" value="Left Panel"/>
						</Params>
						<InputRect orientation="0">
							<v x="0" y="100"/>
							<v x="640" y="100"/>
							<v x="640" y="820"/>
							<v x="0" y="820"/>
						</InputRect>
					</Slice>
					<Slice uniqueId="2002">
						<Params name="Common">
							<Param name="Name" default="Layer" value="Right Panel"/>
						</Params>
						<InputRect orientation="30">
							<v x="1276.795" y="353.397"/>
							<v x="1623.205" y="553.397"/>
							<v x="1523.205" y="726.603"/>
							<v x="1176.795" y="526.603"/>
						</InputRect>
					</Slice>
					<Slice uniqueId="2003">
						<Params name="Common">
							<Param name="Name" default="Layer" value="Warped Skip"/>
						</Params>
						<InputRect orientation="0">
							<v x="700" y="200"/>
							<v x="1100" y="220"/>
							<v x="1050" y="600"/>
							<v x="720" y="580"/>
						</InputRect>
					</Slice>
				</layers>
			</Screen>
		</screens>
	</ScreenSetup>
</XmlState>`

// --- Geometry helpers ---
assert(
  isRectangularQuad([
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 50 },
    { x: 0, y: 50 },
  ]),
  'axis-aligned quad should be rectangular',
)

const axis = rectFromRectangularQuad([
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 50 },
  { x: 0, y: 50 },
])
assert(axis, 'axis-aligned rectFromQuad')
assert(axis.width === 100 && axis.height === 50, 'axis size')
assert(axis.cx === 50 && axis.cy === 25, 'axis center')
assert(Math.abs(axis.rotationDeg) < 0.01, 'axis rotation ~0')

assert(
  !isRectangularQuad([
    { x: 0, y: 0 },
    { x: 100, y: 10 },
    { x: 90, y: 80 },
    { x: 10, y: 70 },
  ]),
  'trapezoid should not be rectangular',
)

const rotated = rectFromRectangularQuad([
  { x: 1276.795, y: 353.397 },
  { x: 1623.205, y: 553.397 },
  { x: 1523.205, y: 726.603 },
  { x: 1176.795, y: 526.603 },
])
assert(rotated, 'rotated rectFromQuad')
assert(Math.abs(rotated.width - 400) < 1, `rotated width got ${rotated.width}`)
assert(Math.abs(rotated.height - 200) < 1, `rotated height got ${rotated.height}`)
assert(Math.abs(rotated.cx - 1400) < 1, `rotated cx got ${rotated.cx}`)
assert(Math.abs(rotated.cy - 540) < 1, `rotated cy got ${rotated.cy}`)
assert(Math.abs(rotated.rotationDeg - 30) < 0.5, `rotated deg got ${rotated.rotationDeg}`)

// --- Fixture XML ---
const result = parseResolumeScreenSetupXml(FIXTURE_XML)

assert(result.composition?.width === 1920, 'explicit composition width')
assert(result.composition?.height === 1080, 'explicit composition height')
assert(result.compositionSource === 'explicit', 'composition source explicit')
assert(result.slices.length === 2, `expected 2 slices, got ${result.slices.length}`)
assert(result.skippedCount === 1, `expected 1 skipped, got ${result.skippedCount}`)
assert(result.slices[0].name === 'Left Panel', 'left name')
assert(result.slices[1].name === 'Right Panel', 'right name')
assert(result.slices[0].color.startsWith('#'), 'color assigned')
assert(result.slices[0].id !== result.slices[1].id, 'unique ids')

const left = result.slices[0]
assert(Math.abs(left.width - 640) < 0.5, 'left width')
assert(Math.abs(left.height - 720) < 0.5, 'left height')
assert(Math.abs(left.cx - 320) < 0.5, 'left cx')
assert(Math.abs(left.cy - 460) < 0.5, 'left cy')

let threw = false
try {
  parseResolumeScreenSetupXml('<html><body/></html>')
} catch (e) {
  threw = e instanceof ResolumeXmlImportError
}
assert(threw, 'unrecognized root should throw ResolumeXmlImportError')

threw = false
try {
  parseResolumeScreenSetupXml('not xml at all {{{')
} catch (e) {
  threw = e instanceof ResolumeXmlImportError
}
assert(threw, 'garbage should throw')

const minimal = `<?xml version="1.0"?>
<XmlState name="Mini">
  <ScreenSetup name="ScreenSetup">
    <screens>
      <Screen name="S">
        <layers>
          <Slice>
            <Params name="Common"><Param name="Name" value="A"/></Params>
            <InputRect>
              <v x="0" y="0"/><v x="100" y="0"/><v x="100" y="80"/><v x="0" y="80"/>
            </InputRect>
          </Slice>
        </layers>
      </Screen>
    </screens>
  </ScreenSetup>
</XmlState>`
const inferred = parseResolumeScreenSetupXml(minimal)
assert(inferred.compositionSource === 'inferred', 'infer source')
assert(inferred.composition?.width === 100 && inferred.composition?.height === 80, 'inferred size')

const project = createDefaultProject()
project.composition = result.composition!
project.slices = result.slices
assert(project.slices.every((s) => s.width > 0 && s.height > 0), 'exportable sizes')
assert(project.composition.width > 0 && project.composition.height > 0, 'exportable composition')

console.log('resolume-xml tests OK')
