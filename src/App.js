import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import { convert, getAxieBriefList, getAxieBriefListTotal, getBodyParts } from './axies';
import { ProgressBar, Container, Row, Col, Tab, Tabs, InputGroup, FormControl } from 'react-bootstrap';
import Accordion from 'react-bootstrap/Accordion';

function App()
{
  const [criteria, setCriteria] = useState(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const classes = [{ class: 'Beast', checked: false },
  { class: 'Aquatic', checked: false },
  { class: 'Plant', checked: false },
  { class: 'Bird', checked: false },
  { class: 'Bug', checked: false },
  { class: 'Reptile', checked: false },
  { class: 'Mech', checked: false },
  { class: 'Dawn', checked: false },
  { class: 'Dusk', checked: false }],
  stages = [{ name: 'Egg', checked: false ,stage:1},
  { name: 'Adult', checked: false,stage : 4 },
];

  useEffect(() =>
  {


  }, []);

  const getAxiesExcel = async (page = 0) =>
  {
    var axiesList = [], bp;
    let totalAxies = await getAxieBriefListTotal(null, 1, "PriceAsc", "Sale", JSON.parse(criteria.trim()), null),
      totalPages = Math.ceil(totalAxies / 100) < page ? Math.ceil(totalAxies / 100) : page ?? Math.ceil(totalAxies / 100);
    setTotal(totalPages);
    bp = await getBodyParts();
    var i = 0;
    for (var i = 0; i < totalPages; i++)
    {
      var currentAxie = await getAxieBriefList(null, i, "PriceAsc", "Sale", JSON.parse(criteria.trim()), bp);
      if (currentAxie == null || currentAxie == undefined || currentAxie.length == 0)
      {
        break;
      }
      axiesList = [...axiesList, ...currentAxie];
      setProgress(i);
    }

    convert(axiesList);

  }
  return (
    <div className="App">
      <Container>
        <Row>
          <Col sm={4}>
            <Tabs defaultActiveKey="Genral" id="uncontrolled-tab-example" className="mb-3">
              <Tab eventKey="Genral" title="Genral">
                <Accordion>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Class</Accordion.Header>
                    <Accordion.Body>
                      {classes.map((e) => <InputGroup className="mb-3">
                        <InputGroup.Checkbox
                          value={e.checked}
                          onChange={(ev) => { e.checked = ev.target.checked; console.log(classes); }}
                          aria-label="Checkbox for following text input" />
                        <InputGroup.Text>{e.class}</InputGroup.Text>
                      </InputGroup>)}
                    </Accordion.Body>
                  </Accordion.Item>
                  <Accordion.Item eventKey="1">
                    <Accordion.Header>Stage</Accordion.Header>
                    <Accordion.Body>
                    {stages.map((e) => <InputGroup className="mb-3">
                        <InputGroup.Checkbox
                          value={e.checked}
                          onChange={(ev) => { e.checked = ev.target.checked; }}
                          aria-label="Checkbox for following text input" />
                        <InputGroup.Text>{e.name}</InputGroup.Text>
                      </InputGroup>)}
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>              </Tab>
              <Tab eventKey="profile" title="Profile">
              </Tab>
              <Tab eventKey="contact" title="Contact" disabled>
              </Tab>
            </Tabs>

          </Col>
          <Col sm={8}>
            <div>
              <Row>
                <Col>
                  <textarea value={criteria} onChange={(e) => { setCriteria(e.target.value) }} ></textarea>
                </Col>
              </Row>
              <Row>
                <Col>
                  <button onClick={() => getAxiesExcel()} >export all</button>
                </Col>
              </Row>
              <Row>
                <Col>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12].map((v) => <button value={v} onClick={(e) => getAxiesExcel(e.target.value)}>page :{v}</button>)}
                </Col>
              </Row>
              <Row >
                <Col>
                  <ProgressBar now={((progress + 1) / total) * 100} max={100} label={`${((progress) / total) * 100}`} />
                </Col>
              </Row>
            </div>
          </Col>
        </Row>

      </Container>
    </div>

  );
}

export default App;
