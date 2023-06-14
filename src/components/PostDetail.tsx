import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonPage,
  IonRouterLink,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { useAppDispatch, useAppSelector } from "../store";
import { useLocation, useParams } from "react-router";
import Stats from "./Stats";
import styled from "@emotion/styled";
import Embed from "./Embed";
import Comments from "./Comments";
import Markdown from "./Markdown";
import PostActions from "./PostActions";
import { useEffect, useMemo, useRef, useState } from "react";
import { findLoneImage } from "../helpers/markdown";
import { receivedPosts } from "../features/post/postSlice";
import { getHandle, getItemActorName, isUrlImage } from "../helpers/lemmy";
import AppBackButton from "./AppBackButton";
import Img from "./Img";
import { Link } from "react-router-dom";
import { PageContext } from "../features/auth/PageContext";
import { maxWidthCss } from "./AppContent";
import { getClient } from "../services/lemmy";
import PersonLabel from "./PersonLabel";

const BorderlessIonItem = styled(IonItem)`
  --padding-start: 0;
  --inner-padding-end: 0;

  ${maxWidthCss}
`;

export const CenteredSpinner = styled(IonSpinner)`
  position: relative;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

const Container = styled.div`
  margin: 0 0 1rem;
  width: 100%;
`;

const LightboxImg = styled(Img)`
  width: 100%;
  max-height: 50vh;
  object-fit: contain;
  background: var(--lightroom-bg);
`;

const StyledMarkdown = styled(Markdown as any)`
  img {
    display: block;
    max-width: 100%;
    max-height: 50vh;
    object-fit: contain;
    object-position: 0%;
  }
`;

const StyledEmbed = styled(Embed)`
  margin: 1rem 0;
`;

const PostDeets = styled.div`
  margin: 0 1rem;
  font-size: 0.9em;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-size: 1em;
  }
`;

const Title = styled.div`
  font-size: 1.3em;
  padding: 1rem 0 0;
  margin-bottom: 1rem;
`;

const By = styled.div`
  color: var(--ion-color-medium);
  margin: 0 0 0.5rem;

  strong,
  a {
    font-weight: 500;
    color: inherit;
    text-decoration: none;
  }
`;

const Aside = styled.div`
  display: inline;
  opacity: 0.7;
`;

export default function PostDetail() {
  const { id, actor } = useParams<{ id: string; actor: string }>();
  const [collapsed, setCollapsed] = useState(false);
  const post = useAppSelector((state) => state.post.postById[id]);
  const dispatch = useAppDispatch();
  const markdownLoneImage = useMemo(
    () => (post?.post.body ? findLoneImage(post.post.body) : undefined),
    [post]
  );
  const jwt = useAppSelector((state) => state.auth.jwt);
  const titleRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLElement | undefined>();
  const { pathname } = useLocation();

  useEffect(() => {
    if (post) return;

    (async () => {
      const result = await getClient(pathname).getPost({ id: +id, auth: jwt });

      dispatch(receivedPosts([result.post_view]));
    })();
  }, [post]);

  useEffect(() => {
    titleRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [collapsed]);

  function renderImage() {
    if (!post) return;

    if (post.post.url && isUrlImage(post.post.url)) {
      return <LightboxImg src={post.post.url} />;
    }

    if (markdownLoneImage)
      return (
        <LightboxImg
          src={markdownLoneImage.url}
          alt={markdownLoneImage.altText}
        />
      );
  }

  function renderText() {
    if (!post) return;

    if (post.post.body && !markdownLoneImage) {
      return (
        <>
          {post.post.url && !isUrlImage(post.post.url) && <Embed post={post} />}
          <StyledMarkdown>{post.post.body}</StyledMarkdown>
        </>
      );
    }

    if (post.post.url && !isUrlImage(post.post.url)) {
      return <StyledEmbed post={post} />;
    }
  }

  if (!post) return <CenteredSpinner />;

  return (
    <IonPage ref={pageRef}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <AppBackButton
              defaultHref="../"
              defaultText={post.community.name}
            />
          </IonButtons>
          <IonTitle>{post?.counts.comments} Comments</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageContext.Provider value={{ page: pageRef.current }}>
          <BorderlessIonItem
            onClick={(e) => {
              if (e.target instanceof HTMLElement && e.target.nodeName === "A")
                return;

              setCollapsed(!collapsed);
            }}
          >
            <Container>
              <div onClick={(e) => e.stopPropagation()}>{renderImage()}</div>
              <PostDeets>
                <Title ref={titleRef}>{post.post.name}</Title>
                {!collapsed && renderText()}
                <By>
                  in{" "}
                  <Link
                    to={`/${actor}/c/${getHandle(post.community)}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {post.community.name}
                    {!post.community.local && (
                      <Aside>@{getItemActorName(post.community)}</Aside>
                    )}
                  </Link>{" "}
                  by{" "}
                  <strong>
                    <PersonLabel person={post.creator} />
                  </strong>
                </By>
                <Stats stats={post.counts} />
              </PostDeets>
            </Container>
          </BorderlessIonItem>

          <BorderlessIonItem>
            <PostActions post={post} />
          </BorderlessIonItem>

          <Comments postId={post.post.id} op={post.creator} />
        </PageContext.Provider>
      </IonContent>
    </IonPage>
  );
}
