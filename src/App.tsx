//@ts-ignore
import { Canvas, useThree } from '@react-three/fiber'
import './App.css'
import { CycleRaycast, Environment, Grid, OrbitControls, Sky, Stats, useGLTF } from '@react-three/drei'
import { ChangeEvent, Suspense, useEffect, useRef, useState } from 'react'
import { SkidLoaderModel } from './components/SkidLoader'
import { Color, Mesh } from 'three'
import { MOCK_CONFIGS } from './mocks/mockConfigs'
import { MOCK_GROUPS } from './mocks/mockGroups'
import { HexColorPicker } from 'react-colorful'


export function Scene({ children }) {
  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.7} />
      <Sky />
      <Suspense fallback={null}>
        {children}
      </Suspense>
      <OrbitControls target={[0, 1, 0]} enableDamping={false} />
      <Grid infiniteGrid cellColor={new Color('black')} sectionColor={new Color('black')} fadeDistance={30} position={[0, -0.045, 0]} />
      <Stats />
    </>
  )
}

function App() {
  const { scene, ...rest } = useGLTF('https://storage.googleapis.com/formacloud-storage-cdn-stg/demo-files/SkidLoader.gltf');
  const [parts, setParts] = useState<Object>();
  const [meshVariantName, setMeshVariantName] = useState('');
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: '', parts: [] })
  const [groupVariants, setGroupVariants] = useState({});
  const [partColorVariants, setPartColorVariants] = useState({});
  const [selectedPart, setSelectedPart] = useState("");
  const [partColors, setPartColors] = useState({})

  useEffect(() => {
    if (!parts) {
      setParts(scene.children.reduce((partsMap: any, part: Mesh) => {
        partsMap[part.name] = true;
        return partsMap
      }, {}))
    }
  }, [scene?.children])

  const handleSetGroupState = (state: any) => {
    setParts({ ...parts, ...state });
  }

  const handleAddRemoveGroup = (partName: string) => {
    const _groupParts = newGroup.parts.slice();

    const partIndex = _groupParts.findIndex(part => part === partName);
    if (partIndex > -1) {
      _groupParts.splice(partIndex, 1);
    } else {
      _groupParts.push(partName);
    }

    setNewGroup({ ...newGroup, parts: _groupParts })
  }

  const createGroup = (e) => {
    e.preventDefault();

    if (!newGroup.name || !newGroup.parts.length) {
      return;
    }

    const _groups = groups.slice();
    _groups.push(newGroup);
    setGroups(_groups);
    setNewGroup({ name: '', parts: [] });
  }

  const saveColorVariant = () => {
    if (!partColorVariants[selectedPart]) {
      setPartColorVariants({ ...partColorVariants, [selectedPart]: [partColors[selectedPart]] })
    } else {
      const _partColors = partColorVariants[selectedPart].slice();
      _partColors.push(partColors[selectedPart]);
      setPartColorVariants({ ...partColorVariants, [selectedPart]: _partColors })
    }
  }

  const handleNewConfiguration = (e: any, groupName: string) => {
    e.preventDefault();

    if (!meshVariantName) { return; }

    const group = groups.find(({ name }) => name === groupName)
    const partStates = group?.parts.reduce((allStates, partName) => {
      allStates[partName] = parts[partName];
      return allStates;
    }, {})

    const newMeshVariant = { name: meshVariantName, state: partStates };
    const _groupVariants = { ...groupVariants };
    if (_groupVariants[groupName]) {
      _groupVariants[groupName].push(newMeshVariant);
    } else {
      _groupVariants[groupName] = [newMeshVariant];
    }
    setGroupVariants(_groupVariants)
  }

  const handlePartChecked = (e: ChangeEvent, partName: string) => {
    setParts(prev => ({ ...prev, [partName]: !prev[partName] }))
  }

  const handleSelectPart = (partName) => {
    setSelectedPart(selectedPart === partName ? undefined : partName);
  }

  return (
    <div className="app">
      <Canvas shadows camera={{ position: [-3, 2, 3], fov: 60 }} className="main-canvas">
        <Scene>
          <SkidLoaderModel userData={{ parts, selectedPart, partColors }} />
        </Scene>
      </Canvas>
      <div className='color-picker'>
        {!!selectedPart &&
          <div>
            <HexColorPicker className="picker" color={partColors[selectedPart] || undefined} onChange={value => setPartColors({ ...partColors, [selectedPart]: value })} />
            <button style={{ marginTop: '26px', position: 'relative', right: '82px', fontSize: '16px', padding: '6px', }} onClick={saveColorVariant}>save</button>
          </div>
        }
      </div>
      <div className='hierarchy-container'>
        <div className='hierarchy'>
          <div>
            <h1>Scene</h1>
            {parts && Object.keys(parts).map(partName =>
              <>
                <div key={partName} className="part-selection">
                  <input type="checkbox" checked={parts[partName]} onChange={(e) => handlePartChecked(e, partName)} />
                  <span onClick={() => handleSelectPart(partName)}>
                    {selectedPart === partName ? <b>{partName.replaceAll('_', ' ').replaceAll('-', ' ')}</b> : <span>{partName.replaceAll('_', ' ').replaceAll('-', ' ')}</span>}
                  </span>
                  &nbsp;&nbsp;&nbsp;
                  <button onClick={() => handleAddRemoveGroup(partName)}>{newGroup.parts.includes(partName) ? 'remove' : 'add'}</button>
                </div>
                <div className='color-variant-container'>
                  {partColorVariants[partName] && partColorVariants[partName].map(color =>
                    <div style={{ backgroundColor: color }} className="color-variant" onClick={() => setPartColors({ ...partColors, [partName]: color })}></div>)}
                </div>
              </>
            )}
            {!!newGroup.parts.length && <div>
              <h3>New Variant Group</h3>
              <ul>
                {newGroup.parts.map(part => <li key={part}>{part}</li>)}
              </ul>
              <form onSubmit={createGroup}>
                <input onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} value={newGroup.name}></input>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <button>Create</button>
              </form>
            </div>}
          </div>
          <div>
            <h2>Groups</h2>
            {groups.map(group => <div style={{ marginTop: '16px' }}>
              <b>{group?.name}</b>
              {parts && group.parts.map((partName: string) => <div>
                <input type="checkbox" checked={parts[partName]} onChange={(e) => handlePartChecked(e, partName)} />
                <span>{partName.replaceAll('_', ' ').replaceAll('-', ' ')}</span>
              </div>)}
              <form onSubmit={(e) => handleNewConfiguration(e, group.name)}>
                <input value={meshVariantName} onChange={e => setMeshVariantName(e.target.value)}></input>
                &nbsp;&nbsp;&nbsp;&nbsp;<button>save state</button>
              </form>
              {groupVariants[group.name] &&
                <div style={{ marginTop: '8px' }}>
                  {groupVariants[group.name].map((variant, index) => <button key={`${index + 1}`} onClick={() => handleSetGroupState(variant.state)}>{variant.name}</button>)}
                </div>
              }
            </div>)}
          </div>
        </div>
      </div>
    </div >
  )
}

export default App
